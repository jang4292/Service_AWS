var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    const tempArray = tempMainMenuList.map((name, index) => {
        return {
            idx: index,
            menuName: name
        }
    });
    res.status(200);
    res.json(tempArray);
});

module.exports = router;

const tempMainMenuList = ["계산기0", "계산기1", "계산기2", "계산기3"];