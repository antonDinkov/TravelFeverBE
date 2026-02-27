const { Router } = require("express");
const { isUser } = require("../middlewares/guards");

const tripsRouter = Router();


tripsRouter.get('/mytrips', isUser(), async (req, res) => {

})

tripsRouter.post('/mytrips/create', isUser(), async (req, res) => {

})

tripsRouter.put('/mytrips/edit/:id', isUser(), async (req, res) => {

})

tripsRouter.delete('/mytrips/:id', isUser(), async (req, res) => {

})


module.exports = { tripsRouter };