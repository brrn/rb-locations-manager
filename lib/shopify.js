const Shopify = require("shopify-api-node");
const debug = (process.env.DEBUG === "true") | false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shopify = new Shopify({
  shopName: "rarebrew",
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_PASSWORD,
});

const getShopifyOrders = async () => {
  const oneYearAgo = new Date();
  oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
  const oneYearAgoISOString = oneYearAgo.toISOString();

  debug &&
    console.log(`Fetching sales data from ${oneYearAgoISOString} onwards...`);

  // Define an array of channel names
  const channels = ["Faire", "Airgoods"]; // Replace with your channel names

  // Initialize an array to store all orders
  let allOrders = [];

  // Loop through each channel
  for (const channel of channels) {
    let params = {
      limit: 250,
      status: "any",
      source_name: channel,
      created_at_min: oneYearAgoISOString,
    };

    do {
      const fetchedOrders = await shopify.order.list(params);
      debug &&
        console.log(
          `Fetched ${
            fetchedOrders.length
          } orders from ${channel}. Total orders so far: ${
            allOrders.length + fetchedOrders.length
          }`
        );
      allOrders = allOrders.concat(fetchedOrders);
      params = fetchedOrders.nextPageParameters;
      await delay(500); // Don't piss off Shopify
    } while (params !== undefined);
  }

  return allOrders;
};

const extractSkusFromOrders = (orders) => {
  return [
    ...new Set(
      orders.flatMap((order) =>
        order.line_items
          .filter((item) => item.product_exists)
          .map((item) => item.sku)
      )
    ),
  ].filter((sku) => sku);
};

const getShopifyCustomer = async (customerId) => {
  const customer = await shopify.customer.get(customerId);
  await delay(500); // Don't piss off Shopify
  return customer;
};

const getShopifyLocationsAsset = async () => {
  try {
    const themes = await shopify.theme.list();
    const mainTheme = themes.find((theme) => theme.role === "main");
    const themeId = mainTheme.id;

    const asset = await shopify.asset.get(themeId, {
      "asset[key]": "assets/locations-data.js",
    });

    // Extract the storeLocations, manualLocations, and skus from the asset content
    const content = asset.value;
    const storeLocationsMatch = content.match(
      /var storeLocations = (\[[\s\S]*?\]);/
    );
    const manualLocationsMatch = content.match(
      /var manualLocations = (\[[\s\S]*?\]);/
    );
    const skusMatch = content.match(/var skus = (\[[\s\S]*?\]);/);

    if (storeLocationsMatch && manualLocationsMatch && skusMatch) {
      const storeLocations = JSON.parse(storeLocationsMatch[1]);
      const manualLocations = JSON.parse(manualLocationsMatch[1]);
      const skus = JSON.parse(skusMatch[1]);
      return { storeLocations, manualLocations, skus };
    } else {
      console.log(
        "Couldn't parse existing locations data, starting with empty data"
      );
      return { storeLocations: [], manualLocations: [], skus: [] };
    }
  } catch (error) {
    console.error("Error fetching existing locations data:", error.message);
    return { storeLocations: [], manualLocations: [], skus: [] };
  }
};

const updateShopifyLocationsAsset = async (assetContent) => {
  debug && console.log("Content length:", assetContent.length);

  try {
    const themes = await shopify.theme.list();
    const mainTheme = themes.find((theme) => theme.role === "main");
    const themeId = mainTheme.id;

    const assetParams = {
      key: "assets/locations-data.js",
      value: assetContent,
      content_type: "application/javascript",
    };

    await shopify.asset.update(themeId, assetParams);
    debug && console.log("Shopify asset updated successfully");
  } catch (error) {
    console.error("Error updating Shopify asset:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response body:", error.response.body);
    }
  }
};

module.exports = {
  getShopifyOrders,
  extractSkusFromOrders,
  getShopifyCustomer,
  getShopifyLocationsAsset,
  updateShopifyLocationsAsset,
};
