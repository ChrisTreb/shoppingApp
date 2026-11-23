const IMAGE_MAP = {
  'Fruits et légumes': require('../../img/products/fruits.png'),
  'Produits frais': require('../../img/products/fresh.png'),
  'Epicerie': require('../../img/products/spices.png'),
  'Liquides': require('../../img/products/liquid.png'),
  'Surgelés': require('../../img/products/frozen.png'),
  'Hygiène': require('../../img/products/hygiene.png'),
  'Textile': require('../../img/products/textile.png'),
  'Droguerie': require('../../img/products/hardware.png'),
};

const DEFAULT_IMAGE = require('../../img/products/other.png');

export default function getProductImage(type) {
  return IMAGE_MAP[type] || DEFAULT_IMAGE;
}
