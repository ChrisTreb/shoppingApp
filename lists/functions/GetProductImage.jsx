import types from '../../variables/Types';

export default function setImage(type) {

    var imgPath = "";

    if (type == types[0]) { imgPath = require('../../img/products/fruits.png'); }
    else if (type == types[1]) { imgPath = require('../../img/products/fresh.png'); }
    else if (type == types[2]) { imgPath = require('../../img/products/spices.png'); }
    else if (type == types[3]) { imgPath = require('../../img/products/liquid.png'); }
    else if (type == types[4]) { imgPath = require('../../img/products/frozen.png'); }
    else if (type == types[5]) { imgPath = require('../../img/products/hygiene.png'); }
    else if (type == types[6]) { imgPath = require('../../img/products/textile.png'); }
    else if (type == types[7]) { imgPath = require('../../img/products/hardware.png'); }
    else { imgPath = require('../../img/products/other.png'); }

    return imgPath;
}
