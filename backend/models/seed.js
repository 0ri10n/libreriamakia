const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Book = require('./models/Book'); 

// Conecta a tu DB
mongoose.connect('mongodb+srv://actividad4:ag6RiVCu6MSRCur@clusteract4.o7oknsb.mongodb.net/?appName=ClusterACT4') 
  .then(() => console.log('Conectado a Mongo'))
  .catch(err => console.error(err));

const categoryMap = {
  'Science Fiction': 'Ciencia Ficción',
  'Fantasy': 'Fantasia',
  'Mystery': 'Misterio',
  'Horror': 'Terror',
  'Adventure': 'Aventuras',
  'Classic Fiction': 'Literatura Clásica',
  'Romance': 'Romance',
  'Historical Fiction': 'Historia y Biografías',
  'Biography': 'Historia y Biografías',
  'Non-fiction': 'Arte y Cultura', 
  "Children's Fiction": 'Cuentos Infantiles',
  "Children's Activity": 'Cuentos Infantiles',
  'Thriller': 'Misterio', 
  'Reference': 'Arte y Cultura',
  'Romance Comedy': 'Romance',
  'Drama': 'Literatura Clásica'
};

const results = [];

fs.createReadStream('books.csv')
  .pipe(csv())
  .on('data', (row) => {
    
    const mappedCategory = categoryMap[row.category] || 'Arte y Cultura';

    const cleanAge = parseInt(row.ageRates.replace(/\D/g, '')) || 0;

    results.push({
      title: row.title,
      author: row.author,
      description: row.description,
      category: mappedCategory, 
      image: row.image,
      ageRates: cleanAge, 
      stock: parseInt(row.stock) || 0
    });
  })
  .on('end', async () => {
    try {
      await Book.deleteMany({}); 
      await Book.insertMany(results);
      console.log('¡Libros importados y traducidos correctamente!');
      mongoose.connection.close();
    } catch (error) {
      console.error('Error al importar:', error);
      mongoose.connection.close();
    }
  });