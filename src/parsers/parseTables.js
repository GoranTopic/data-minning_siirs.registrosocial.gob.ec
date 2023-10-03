const parseTables = async tables => {
	let data = {};
	// save the text of the table tag
	let rows = await tables[0].$$('tr')
	let header = await rows[0].innerText();
	data.header = header;
	for (let i = 1; i < rows.length; i++) {
		let row = await rows[i].innerText();
		let key = row.split(':')[0];
		let value = row.split(':')[1];
		data[key] = value;
	}
	// parse second table
	data['Datos de la familia'] = []
	rows = await tables[1].$$('tr')
	let headers = (await rows[0].innerText()).split('\t');
	for (let i = 1; i < rows.length; i++) {
		let familia = {};
		let row = await rows[i].innerText();
		let values = row.split('\t');
		for (let j = 0; j < headers.length; j++) {
			familia[headers[j]] = values[j];
		}
		data['Datos de la familia'].push(familia); 
	}                   
	return data;
}

export default parseTables;

