require("dotenv").config();

const {
  getShopifyOrders,
  extractSkusFromOrders,
  getShopifyCustomer,
  getShopifyLocationsAsset,
  updateShopifyLocationsAsset,
} = require("./lib/shopify");
const { geocodeAddress } = require("./lib/google");
const { sendEmail } = require("./lib/email");
const { sendSlack } = require("./lib/slack");
const { processApprovedSubmissions } = require("./lib/manual-submissions");

const debug = (process.env.DEBUG === "true") | false;

async function updateMapData() {
  debug && console.log("Starting updateMapData function");

  try {
    const newCustomers = [];
    const updatedCustomers = [];
    const removedLocations = [];
    const problemCustomers = [];

    const shopifyOrders = await getShopifyOrders();

    // Find unique active customers across all channels
    const activeCustomerIds = new Set(
      shopifyOrders
        .map((order) => order.customer && order.customer.id)
        .filter((id) => id)
    );
    console.log(
      `Found ${activeCustomerIds.size} unique active customers across all channels in the past year`
    );

    debug && console.log("Loading existing location data from Shopify...");
    const {
      storeLocations,
      manualLocations,
      skus: existingSkus,
    } = await getShopifyLocationsAsset();
    debug &&
      console.log(
        `Loaded ${storeLocations.length} existing store locations and ${manualLocations.length} manual locations`
      );

    // Process any approved and rejected manual submissions
    console.log("Processing approved and rejected manual submissions...");
    const { newManualLocations, rejectedManualLocations, remainingPending } = await processApprovedSubmissions();
    
    if (newManualLocations.length > 0) {
      console.log(`Adding ${newManualLocations.length} new approved manual locations`);
      manualLocations.push(...newManualLocations);
    }
    
    if (rejectedManualLocations.length > 0) {
      console.log(`Adding ${rejectedManualLocations.length} rejected manual locations`);
      manualLocations.push(...rejectedManualLocations);
    }
    
    if (remainingPending > 0) {
      console.log(`${remainingPending} submissions still pending approval`);
    }

    // Remove inactive customers from storeLocations, but keep track of removed locations
    let updatedStoreLocations = storeLocations.filter((location) => {
      if (
        activeCustomerIds.has(location.id) ||
        manualLocations.some((manual) => manual.id === location.id)
      ) {
        return true;
      } else {
        debug &&
          console.log(
            `Removing inactive customer: ${location.name}, ${location.address}`
          );
        removedLocations.push(location);
        return false;
      }
    });

    debug &&
      console.log(
        `After removing inactive customers: ${updatedStoreLocations.length} store locations`
      );

    const existingLocations = new Map(
      updatedStoreLocations.map((loc) => [loc.id, loc])
    );

    console.log("Processing active customers...");

    for (const customerId of activeCustomerIds) {
      debug && console.log(`Processing customer ID: ${customerId}`);
      try {
        const customer = await getShopifyCustomer(customerId);
        const existingLocation = existingLocations.get(customerId);
        const manualLocation = manualLocations.find(
          (loc) => loc.id === customerId
        );

        if (manualLocation) {
          debug &&
            console.log(`Using manual location for customer ${customerId}`);
          updatedStoreLocations = updatedStoreLocations.filter(
            (loc) => loc.id !== customerId
          );
          updatedStoreLocations.push(manualLocation);
        } else if (existingLocation) {
          debug &&
            console.log(
              `Updating existing location for customer ${customerId}`
            );
          const customerShopifyOrders = shopifyOrders.filter(
            (order) => order.customer && order.customer.id === customerId
          );
          const skus = extractSkusFromOrders(customerShopifyOrders);
          existingLocation.skus = skus;
          updatedCustomers.push(existingLocation);
        } else if (customer.default_address) {
          debug &&
            console.log(
              `Customer ${customerId} has address data, attempting to geocode`
            );
          const address = `${customer.default_address.address1}, ${customer.default_address.city}, ${customer.default_address.province} ${customer.default_address.zip}, ${customer.default_address.country}`;
          const geoData = await geocodeAddress(address);
          if (geoData) {
            debug &&
              console.log(
                `Successfully geocoded address for customer ${customerId}`
              );
            const customerShopifyOrders = shopifyOrders.filter(
              (order) => order.customer && order.customer.id === customerId
            );
            const skus = extractSkusFromOrders(customerShopifyOrders);
            const newLocation = {
              id: customer.id,
              name:
                customer.default_address.company ||
                `${customer.first_name} ${customer.last_name}`,
              address: address,
              lat: geoData.lat,
              lng: geoData.lng,
              skus: skus,
              salesChannel: customerShopifyOrders.find(
                (order) => order.source_name !== null
              )?.source_name,
            };
            newCustomers.push(newLocation);
            updatedStoreLocations.push(newLocation);
            debug &&
              console.log(
                `Added new location: ${newLocation.name}, ${newLocation.address}`
              );
          } else {
            debug &&
              console.log(
                `Failed to geocode address for customer ${customerId}, skipping`
              );
            problemCustomers.push({
              id: customer.id,
              name:
                customer.default_address.company ||
                `${customer.first_name} ${customer.last_name}`,
              address: address,
              reason: "Failed to geocode address",
            });
          }
        } else {
          debug &&
            console.log(
              `Customer ${customerId} does not have address data, skipping`
            );
          problemCustomers.push({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            reason: "No address data available",
          });
        }
      } catch (error) {
        console.error(
          `Error processing customer ${customerId}:`,
          error.message
        );
        problemCustomers.push({
          id: customerId,
          reason: `Error: ${error.message}`,
        });
        continue;
      }
    }

    debug &&
      console.log(
        `Added ${newCustomers.length} new locations and updated ${updatedCustomers.length} existing locations from Shopify`
      );

    updatedStoreLocations = updatedStoreLocations.map(
      (loc) => updatedCustomers.find((u) => u.id === loc.id) || loc
    );

    // Filter out rejected manual locations before sending to Shopify
    const activeManualLocations = manualLocations.filter(loc => loc.status !== "rejected");
    
    // Merge active manualLocations with updatedStoreLocations, giving priority to manualLocations
    const mergedLocations = [
      ...activeManualLocations,
      ...updatedStoreLocations.filter(
        (loc) => !activeManualLocations.some((manual) => manual.id === loc.id)
      ),
    ];

    const updatedSkus = [
      ...new Set([
        ...existingSkus,
        ...mergedLocations.flatMap((loc) => loc.skus),
      ]),
    ];

    console.log("Updating Shopify asset...");
    const assetContent = `var manualLocations = ${JSON.stringify(
      activeManualLocations,
      null,
      2
    )};\nvar storeLocations = ${JSON.stringify(
      mergedLocations,
      null,
      2
    )};\nvar skus = ${JSON.stringify(updatedSkus, null, 2)};`;
    await updateShopifyLocationsAsset(assetContent);

    console.log(`New locations added: ${newCustomers.length}`);
    newCustomers.forEach((customer) => {
      console.log(`- ${customer.name}, ${customer.address}`);
    });

    console.log(`New approved manual locations added: ${newManualLocations.length}`);
    newManualLocations.forEach((location) => {
      console.log(`- ${location.name}, ${location.address}`);
    });

    console.log(`Rejected manual locations tracked (not sent to Shopify): ${rejectedManualLocations.length}`);
    rejectedManualLocations.forEach((location) => {
      console.log(`- ${location.name}, ${location.address} (Rejected: ${location.rejectionReason})`);
    });

    console.log(`Inactive locations removed: ${removedLocations.length}`);
    removedLocations.forEach((location) => {
      console.log(`- ${location.name}, ${location.address}`);
    });

    console.log(`Problems encountered: ${problemCustomers.length}`);
    problemCustomers.forEach((customer) => {
      console.log(`- ${customer.name || customer.id}: ${customer.reason}`);
    });

    // Prepare notification
    let notification = "";
    if (newCustomers.length > 0) {
      notification += `New locations added: ${newCustomers.length}\n\n`;
      newCustomers.forEach((customer) => {
        notification += `${customer.name}\n${customer.address}\n\n`;
      });
      notification += "\n";
    }

    if (newManualLocations.length > 0) {
      notification += `New approved manual locations added: ${newManualLocations.length}\n\n`;
      newManualLocations.forEach((location) => {
        notification += `${location.name}\n${location.address}\n\n`;
      });
      notification += "\n";
    }

    // if (rejectedManualLocations.length > 0) {
    //   notification += `Rejected manual locations tracked (not sent to Shopify): ${rejectedManualLocations.length}\n\n`;
    //   rejectedManualLocations.forEach((location) => {
    //     notification += `${location.name}\n${location.address}\nRejection Reason: ${location.rejectionReason}\n\n`;
    //   });
    //   notification += "\n";
    // }

    if (removedLocations.length > 0) {
      notification += `Inactive locations removed: ${removedLocations.length}\n\n`;
      removedLocations.forEach((location) => {
        notification += `${location.name}\n${location.address}\n\n`;
      });
      notification += "\n";
    }

    if (problemCustomers.length > 0) {
      notification += `Problems encountered: ${problemCustomers.length}\n`;
      problemCustomers.forEach((customer) => {
        notification += `- ${customer.name || customer.id}: ${customer.reason}\n`;
      });
      notification += "\n";
    }

    if (notification) {
      // Email notification is no needed at this time
      // await sendEmail(notification);
      await sendSlack(notification);
    } else {
      console.log("No changes to notify about");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating map data:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response body:", error.response.body);
    }
    console.error("Full error object:", error);

    // Send error notification email
    const emailBody = `An error occurred while updating the map data:\n\n${error.message}\n\nPlease check the server logs for more details.`;
    await sendEmail(emailBody);

    process.exit(1);
  }
}

updateMapData();
