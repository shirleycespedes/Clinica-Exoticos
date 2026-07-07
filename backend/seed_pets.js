const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Cherry1234',
    database: 'clinica_exoticos'
};

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a MySQL para sembrar mascotas...');

        const [props] = await connection.query('SELECT * FROM propietarios');
        console.log(`Encontrados ${props.length} propietarios.`);

        // Lista de mascotas exóticas para sembrar (cumpliendo con ENUMs de base de datos)
        const exoticPets = [
            { nombre: 'Spike', especie: 'Erizo de tierra', tipo_animal: 'Mamifero_Exotico', habitat: 'Jaula amplia', dieta: 'Insectivoro', sexo: 'Macho', peso: '0.45' },
            { nombre: 'Rocky', especie: 'Tortuga rusa', tipo_animal: 'Reptil', habitat: 'Terrario seco', dieta: 'Herbivoro', sexo: 'Macho', peso: '0.95' },
            { nombre: 'Paco', especie: 'Loro frente azul', tipo_animal: 'Ave', habitat: 'Pajarera amplia', dieta: 'Omnivoro', sexo: 'Macho', peso: '0.38' },
            { nombre: 'Yoshi', especie: 'Gecko leopardo', tipo_animal: 'Reptil', habitat: 'Terrario desértico', dieta: 'Insectivoro', sexo: 'Hembra', peso: '0.07' }
        ];

        let exoticIndex = 0;

        for (const prop of props) {
            // Obtener mascotas actuales del propietario
            const [pets] = await connection.query('SELECT * FROM pacientes WHERE propietario_id = ?', [prop.id]);
            console.log(`Propietario ${prop.nombre} ${prop.apellido} (ID: ${prop.id}) tiene ${pets.length} mascotas.`);

            const petsNeeded = 2 - pets.length;
            for (let i = 0; i < petsNeeded; i++) {
                const petData = exoticPets[exoticIndex % exoticPets.length];
                exoticIndex++;

                // Insertar mascota
                await connection.query(
                    `INSERT INTO pacientes (propietario_id, nombre, especie, tipo_animal, habitat, dieta, fecha_nacimiento, sexo, peso)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [prop.id, petData.nombre, petData.especie, petData.tipo_animal, petData.habitat, petData.dieta, '2024-01-15', petData.sexo, petData.peso]
                );
                console.log(`  + Creada mascota ${petData.nombre} (${petData.especie}) para propietario ID ${prop.id}`);
            }
        }

        // Crear expedientes clínicos para CUALQUIER mascota que no tenga
        const [allPets] = await connection.query('SELECT * FROM pacientes');
        const today = new Date().toISOString().split('T')[0];

        for (const pet of allPets) {
            const [exps] = await connection.query('SELECT * FROM expedientes WHERE paciente_id = ?', [pet.id]);
            if (exps.length === 0) {
                await connection.query(
                    `INSERT INTO expedientes (paciente_id, fecha_apertura, notas_generales, alergias, enfermedades_cronicas, vacunas)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [pet.id, today, 'Apertura de historial clínico en control preventivo.', 'Ninguna conocida', 'Ninguna', 'Esquema completo']
                );
                console.log(`  + Creado expediente clínico para mascota ${pet.nombre} (ID: ${pet.id})`);
            }
        }

        console.log('Sembrado de mascotas y expedientes finalizado con éxito.');
    } catch (err) {
        console.error('Error durante sembrado:', err);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

seed();
