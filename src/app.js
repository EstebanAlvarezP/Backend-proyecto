const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs/promises'); 


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const productsFilePath = './productos.json';
const cartsFilePath = './carrito.json';


let productsData = [];
let cartsData = [];


async function loadFromFile() {
  try {
    const productsFileContent = await fs.readFile(productsFilePath, 'utf-8');
    const cartsFileContent = await fs.readFile(cartsFilePath, 'utf-8');

    productsData = JSON.parse(productsFileContent);
    cartsData = JSON.parse(cartsFileContent);
  } catch (error) {
    
    console.error('Error al cargar datos desde archivos:', error.message);
  }
}


async function saveToFile() {
  try {
    await fs.writeFile(productsFilePath, JSON.stringify(productsData, null, 2), 'utf-8');
    await fs.writeFile(cartsFilePath, JSON.stringify(cartsData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error al guardar datos en archivos:', error.message);
  }
}


const productsRouter = express.Router();


productsRouter.get('/', (req, res) => {

  const limit = req.query.limit;
  const limitedProducts = limit ? productsData.slice(0, parseInt(limit, 10)) : productsData;
  res.json(limitedProducts);
});

productsRouter.get('/:pid', (req, res) => {
    const productId = parseInt(req.params.pid, 10);
    const product = productsData.find(p => p.id === productId);
  
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  });


productsRouter.delete('/:pid', (req, res) => {
  const productId = parseInt(req.params.pid, 10);

  
  const updatedProducts = productsData.filter(p => p.id !== productId);

  if (updatedProducts.length < productsData.length) {
   
    productsData = updatedProducts;

   
    saveToFile();

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

app.use('/api/products', productsRouter);


const cartsRouter = express.Router();


cartsRouter.get('/:cid', (req, res) => {
    const cartId = req.params.cid;
    const cart = cartsData.find(c => c.id === cartId);
  
    if (cart) {
      res.json(cart.products);
    } else {
      res.status(404).json({ error: 'Carrito no encontrado' });
    }
  });


cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = parseInt(req.params.pid, 10);
  const { quantity } = req.body;

  
  const cart = cartsData.find(c => c.id === cartId);

  if (cart) {
    
    const existingProductIndex = cart.products.findIndex(p => p.product === productId);

    if (existingProductIndex !== -1) {
      
      cart.products[existingProductIndex].quantity += quantity || 1;
    } else {
      
      cart.products.push({ product: productId, quantity: quantity || 1 });
    }

    
    saveToFile();

    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

app.use('/api/carts', cartsRouter);


const PORT = 8080;


loadFromFile();

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});