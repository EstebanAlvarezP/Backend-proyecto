const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs/promises'); // Utilizamos fs/promises para operaciones asincrónicas

// Configuración para parsear el cuerpo de las solicitudes (body)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Archivos de persistencia
const productsFilePath = './productos.json';
const cartsFilePath = './carrito.json';

// Datos de ejemplo (simulando una base de datos)
let productsData = [];
let cartsData = [];

// Función para cargar datos desde archivos
async function loadFromFile() {
  try {
    const productsFileContent = await fs.readFile(productsFilePath, 'utf-8');
    const cartsFileContent = await fs.readFile(cartsFilePath, 'utf-8');

    productsData = JSON.parse(productsFileContent);
    cartsData = JSON.parse(cartsFileContent);
  } catch (error) {
    // Si hay un error al leer los archivos, no se carga nada (podrías manejarlo de manera diferente según tus necesidades)
    console.error('Error al cargar datos desde archivos:', error.message);
  }
}

// Función para guardar datos en archivos
async function saveToFile() {
  try {
    await fs.writeFile(productsFilePath, JSON.stringify(productsData, null, 2), 'utf-8');
    await fs.writeFile(cartsFilePath, JSON.stringify(cartsData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error al guardar datos en archivos:', error.message);
  }
}

// Grupo de rutas "products"
const productsRouter = express.Router();

// Ruta raíz GET /api/products
productsRouter.get('/', (req, res) => {
  // Aplicar la limitación si se proporciona el parámetro ?limit
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

// Ruta DELETE /api/products/:pid
productsRouter.delete('/:pid', (req, res) => {
  const productId = parseInt(req.params.pid, 10);

  // Filtrar la lista de productos para excluir el producto con el ID especificado
  const updatedProducts = productsData.filter(p => p.id !== productId);

  if (updatedProducts.length < productsData.length) {
    // Si se eliminó al menos un producto, actualiza la lista y responde con éxito
    productsData = updatedProducts;

    // Guardar datos en el archivo después de la eliminación
    saveToFile();

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

app.use('/api/products', productsRouter);

// Grupo de rutas "carts"
const cartsRouter = express.Router();

// Ruta raíz GET /api/carts
cartsRouter.get('/:cid', (req, res) => {
    const cartId = req.params.cid;
    const cart = cartsData.find(c => c.id === cartId);
  
    if (cart) {
      res.json(cart.products);
    } else {
      res.status(404).json({ error: 'Carrito no encontrado' });
    }
  });

// Ruta POST /api/carts/:cid/product/:pid
cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = parseInt(req.params.pid, 10);
  const { quantity } = req.body;

  // Buscar el carrito por su ID
  const cart = cartsData.find(c => c.id === cartId);

  if (cart) {
    // Verificar si el producto ya existe en el carrito
    const existingProductIndex = cart.products.findIndex(p => p.product === productId);

    if (existingProductIndex !== -1) {
      // Si el producto ya está en el carrito, incrementar la cantidad
      cart.products[existingProductIndex].quantity += quantity || 1;
    } else {
      // Si el producto no está en el carrito, agregarlo
      cart.products.push({ product: productId, quantity: quantity || 1 });
    }

    // Guardar datos en el archivo después de la actualización del carrito
    saveToFile();

    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

app.use('/api/carts', cartsRouter);

// Configuración del puerto
const PORT = 8080;

// Cargar datos desde archivos al iniciar la aplicación
loadFromFile();

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});