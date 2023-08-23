import fs from 'fs';
import slavery from 'slavery-js';
import Checklist from 'checklist-js';


slavery()
	.master(async master => {
		// read cedulas 
		let cedulas = fs.readFileSync('./storage/cedulas/cedulas_03.txt', 'utf8').split('\n');
		// create checklist
		let ckls = new Checklist(cedulas);
		// get new cedula
		let cedula = ckls.next();
		// send cedula to slave
		while (cedula) {
			let slave = await master.getIdle();
			let result = slave.run(cedula)
				.then(data => {
					console.log('data', data);
				})
			cedula = ckls.next();
		}
	});

