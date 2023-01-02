/**
 * Récupère un tableau de produits depuis une liste déjà créée
 * @param {*} strProducts 
 * @returns [] arrProducts
 */

export default function getProductsFromList(strProducts) {
    // Array d'objets produit
    console.log("products = " + strProducts);
    let arrProducts = [];

    strProducts = "[" + strProducts + "]";
    arrProducts = JSON.parse(strProducts);

    return arrProducts;
}
