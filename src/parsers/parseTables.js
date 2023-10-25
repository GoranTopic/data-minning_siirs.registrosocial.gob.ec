import cheerio from 'cheerio';
import fs from 'fs';

const inconsistentHtmlContent = fs.readFileSync('./re/responses/inconsistencia.html', 'utf8');
const noDataHtmlContent = fs.readFileSync('./re/responses/noData.html', 'utf8');
const moreDataHtmlContent = fs.readFileSync('./re/responses/moreData.html', 'utf8');
const someDataHtmlContent = fs.readFileSync('./re/responses/someData.html', 'utf8');

const clean = str => str.trim().replace(/\s\s+/g, ' ');

const parseTables = htmlContent => {
    const $ = cheerio.load(htmlContent);
    let content = $('.row')
    let str = clean(content.text()
        .split('$(function(){PrimeFaces.cw(')[0])


    if(str === 'Para conocer si te encuentras registrado en la base de datos del Registro Social, ingresa tu número de cédula:') {
        return str;
    }else if( str === 'Usted no consta en el Registro SocialNueva Consulta') {
        return str;
    }else{
        let data = {};
        let [ persona, familia ] = content.find('table');
        // parse the persona data
        let tableRows = $(persona).find('tr');
        tableRows.each((index, row) => {
            if (index === 0) // Skip header row
                data.Sujeto = clean($(row).text());
            else{
                let rowText = $(row).text();
                let key = rowText.split(':')[0];
                let value = rowText.split(':')[1];
                data[key] = value;
            }
        });
        // parse the familia data
        data['Datos de la familia'] = [];
        tableRows = $(familia).find('tr');
        let headers = tableRows.eq(0).find('th').map((index, th) => $(th).text()).get();
        tableRows.each((index, row) => {
            if (index !== 0) { // Skip header row
                let familia = {};
                let values = $(row).find('td').map((index, td) => $(td).text()).get();
                for (let j = 0; j < headers.length; j++) {
                    familia[headers[j]] = values[j];
                }
                data['Datos de la familia'].push(familia);
            }
        });
        return data;
    }



    //console.log('tables: ', tables);
    // get the text from the first table

   
    /*
    // Parsing the first table
    let firstTableRows = $('table').eq(0).find('tr');
    data.header = firstTableRows.eq(0).text();
    firstTableRows.each((index, row) => {
        if (index !== 0) { // Skip header row
            let rowText = $(row).text();
            let key = rowText.split(':')[0];
            let value = rowText.split(':')[1];
            data[key] = value;
        }
    });

    // Parsing the second table
    data['Datos de la familia'] = [];
    let secondTableRows = $('table').eq(1).find('tr');
    let headers = secondTableRows.eq(0).text().split('\t');
    secondTableRows.each((index, row) => {
        if (index !== 0) { // Skip header row
            let familia = {};
            let values = $(row).text().split('\t');
            for (let j = 0; j < headers.length; j++) {
                familia[headers[j]] = values[j];
            }
            data['Datos de la familia'].push(familia);
        }
    });
    */

    return data;
}

//export default parseTables;


console.log('inconsistentHtmlContent: ');
console.log(parseTables(inconsistentHtmlContent));
console.log('noDataHtmlContent: ');
console.log(parseTables(noDataHtmlContent));
console.log('moreDataHtmlContent: ');
console.log(parseTables(moreDataHtmlContent));
console.log('someDataHtmlContent: ');
console.log(parseTables(someDataHtmlContent));

