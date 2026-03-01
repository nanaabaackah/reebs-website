const SHOP_BG_ASSETS = [
  "/imgs/shopbg/img_1.png",
  "/imgs/shopbg/img_2.png",
  "/imgs/shopbg/img_3.png",
  "/imgs/shopbg/img_4.png",
  "/imgs/shopbg/img_5.png",
  "/imgs/shopbg/img_6.png",
  "/imgs/shopbg/img_7.png",
];

const SHOP_CATEGORY_BG_MAP = {
  "party supplies": "/imgs/shopbg/img_1.png",
  "kids toys": "/imgs/shopbg/img_2.png",
  toys: "/imgs/shopbg/img_2.png",
  "household supplies": "/imgs/shopbg/img_3.png",
  "home supplies": "/imgs/shopbg/img_3.png",
  stationery: "/imgs/shopbg/img_4.png",
  "event supplies": "/imgs/shopbg/img_5.png",
  "gift items": "/imgs/shopbg/img_6.png",
  other: "/imgs/shopbg/img_7.png",
  test: "/imgs/shopbg/img_7.png",
};

const RENTAL_CATEGORY_BG_MAP = {
  "bouncy castles": "/imgs/rentalbg/img_1.png",
  "kids rentals": "/imgs/rentalbg/img_2.png",
  "indoor games": "/imgs/rentalbg/img_3.png",
  setup: "/imgs/rentalbg/img_4.png",
};

const hashString = (value = "") => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normalizeCategoryKey = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/['`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getSourceCode = (item = {}) =>
  (item.sourceCategoryCode || item.sourcecategorycode || "")
    .toString()
    .trim()
    .toLowerCase();

const getSku = (item = {}) =>
  (item.sku || "")
    .toString()
    .trim()
    .toUpperCase();

const getItemName = (item = {}) =>
  item.name || item.productName || "";

const getItemCategory = (item = {}) =>
  item.specificCategory ||
  item.specificcategory ||
  item.type ||
  item.category ||
  item.productCategory ||
  "";

export const getCatalogItemImage = (item = {}) =>
  item.image ||
  item.imageUrl ||
  item.image_url ||
  item.productImage ||
  "/imgs/placeholder.png";

const getShopCategoryKey = (item = {}) => {
  const key = normalizeCategoryKey(getItemCategory(item));
  if (!key) return "";

  if (["kids toys", "kid toys", "kids toy", "kid toy"].includes(key)) {
    return "kids toys";
  }
  if (["party supplies", "party supply"].includes(key)) {
    return "party supplies";
  }
  if (
    [
      "household supplies",
      "household supply",
      "household items",
      "household item",
      "home supplies",
      "home supply",
      "home items",
      "home item",
    ].includes(key)
  ) {
    return "household supplies";
  }
  if (["gift items", "gift item"].includes(key)) {
    return "gift items";
  }

  return key;
};

const getRentalCategoryKey = (item = {}) => {
  const category = normalizeCategoryKey(getItemCategory(item));
  const name = normalizeCategoryKey(getItemName(item));

  if (
    category.includes("bouncy") ||
    name.includes("bouncy") ||
    name.includes("bounce house") ||
    name.includes("castle")
  ) {
    return "bouncy castles";
  }
  if (
    category.includes("indoor") ||
    category.includes("board game") ||
    category.includes("jenga") ||
    name.includes("indoor game") ||
    name.includes("board game") ||
    name.includes("jenga")
  ) {
    return "indoor games";
  }
  if (category.includes("machine") || category.includes("setup")) {
    return "setup";
  }
  if (
    category.includes("kids") ||
    category.includes("kid") ||
    category.includes("rental") ||
    name.includes("popcorn") ||
    name.includes("snow cone") ||
    name.includes("snowcone") ||
    name.includes("cotton candy")
  ) {
    return "kids rentals";
  }

  return "";
};

const isRentalLikeItem = (item = {}) => {
  const source = getSourceCode(item);
  if (source) return source === "rental";
  if (getSku(item).startsWith("REN")) return true;
  return Boolean(getRentalCategoryKey(item));
};

export const getCatalogItemBackground = (item = {}) => {
  const image = getCatalogItemImage(item);

  if (isRentalLikeItem(item)) {
    const rentalCategoryKey = getRentalCategoryKey(item);
    return RENTAL_CATEGORY_BG_MAP[rentalCategoryKey] || image;
  }

  const shopCategoryKey = getShopCategoryKey(item);
  if (!shopCategoryKey) return image;
  if (SHOP_CATEGORY_BG_MAP[shopCategoryKey]) {
    return SHOP_CATEGORY_BG_MAP[shopCategoryKey];
  }

  const fallbackIndex =
    hashString(shopCategoryKey || getItemName(item) || "other") % SHOP_BG_ASSETS.length;
  return SHOP_BG_ASSETS[fallbackIndex];
};

export const getCatalogItemBackgroundStyle = (
  item = {},
  cssVariableName = "--item-category-bg"
) => ({
  [cssVariableName]: `url("${getCatalogItemBackground(item)}")`,
});
