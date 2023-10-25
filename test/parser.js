/* test parser */
import transcribe from '../src/parsers/parser.js';
// Import the necessary modules
import chai from 'chai';
const expect = chai.expect;
// to make into steam   
import fs from 'fs';


// The test suite using Mocha's describe function
describe('check that the ', () => {
    // Test case 1
    it('correcly transcribs the audio "The embellishment kits"', async () => {
        // make the post request
        let responsePromise = transcribe(
            fs.createReadStream("./test/files/The embellishment kits.mpeg")
        );
        await expect(responsePromise).to.eventually.be.fulfilled;
        // check the response
        let response = await responsePromise;
        expect(response).to.equal('The embellishment kits.');
    });
    it('correcly transcribs the audio "The Amazing Collaborative Process"', async () => {
        // make the post request
        let responsePromise = transcribe(
            fs.createReadStream("./test/files/amazing collaborative process.mpeg")
        );
        await expect(responsePromise).to.eventually.be.fulfilled;
        // check the response
        let response = await responsePromise;
        expect(response).to.equal("It's an amazing collaborative process.");
    });
});





/*
 * inconsistentHtmlContent: 
Para conocer si te encuentras registrado en la base de datos del Registro Social, ingresa tu número de cédula:
noDataHtmlContent: 
Usted no consta en el Registro SocialNueva Consulta
moreDataHtmlContent: 
{
  Sujeto: 'Sra. DELGADO MARIA ROCIO DE LOS ANGELES con cédula 0400558862, Usted consta en el Registro Social.',
  Certificado: '7245545',
  Provincia: 'PICHINCHA',
  'Cantón': 'QUITO',
  Parroquia: 'TUMBACO',
  'Fecha entrevista': '23/09/2022',
  'Datos de la familia': [
    {
      'Núcleo': '1',
      Apellidos: 'DELGADO ',
      Nombres: 'MARIA ROCIO DE LOS ANGELES',
      'Cédula': '0400558862',
      Edad: '64',
      Parentesco: 'Jefe(a) de NÚCLEO  ',
      Estado: 'Válido'
    },
    {
      'Núcleo': '1',
      Apellidos: 'MARTINEZ DELGADO',
      Nombres: 'NANCY MIREYA',
      'Cédula': '17XXXXXXXX',
      Edad: '35',
      Parentesco: 'Hijo(a)       ',
      Estado: 'Válido'
    },
    {
      'Núcleo': '1',
      Apellidos: 'MARTINEZ DELGADO',
      Nombres: 'CRISTHIAN ANTONIO',
      'Cédula': '17XXXXXXXX',
      Edad: '25',
      Parentesco: 'Hijo(a)       ',
      Estado: 'Válido'
    }
  ]
}
someDataHtmlContent: 
{
  Sujeto: 'Sra. QUITUIZACA TENEMAZA MARIA ETELVINA con cédula 0701593105, Usted consta en el Registro Social.',
  Certificado: '5096558',
  Provincia: 'AZUAY',
  'Cantón': 'CAMILO PONCE ENRIQUEZ',
  Parroquia: 'EL CARMEN DE PIJILI',
  'Fecha entrevista': '03/09/2020',
  'Datos de la familia': [
    {
      'Núcleo': '1',
      Apellidos: 'QUITUIZACA TENEMAZA',
      Nombres: 'MARIA ETELVINA',
      'Cédula': '0701593105',
      Edad: '62',
      Parentesco: 'Jefe(a) de NÚCLEO  ',
      Estado: 'Válido'
    },
    {
      'Núcleo': '1',
      Apellidos: 'LOZANO QUITUIZACA',
      Nombres: 'ERNESTO JAVIER',
      'Cédula': '07XXXXXXXX',
      Edad: '26',
      Parentesco: 'Hijo(a)       ',
      Estado: 'Válido'
    }
  ]
}
*/
