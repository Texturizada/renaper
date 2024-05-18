const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

const logChatId = '6706461325';

// Cargar la lista blanca desde el archivo JSON
let whitelisteados = require('./whitelisteados.json').ids;

function isWhitelisted(user_id) {
    return whitelisteados.includes(user_id);
}

function addToWhitelist(ctx, userId) {
    if (!whitelisteados.includes(userId)) {
        whitelisteados.push(userId);
        // Guardar la lista actualizada en el archivo JSON
        fs.writeFileSync('./whitelisteados.json', JSON.stringify({ ids: whitelisteados }, null, 2));
        ctx.reply(`El usuario con ID ${userId} ha sido añadido a la lista blanca.`);
    } else {
        ctx.reply(`El usuario con ID ${userId} ya está en la lista blanca.`);
    }
}

function ban(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 2) {
        ctx.reply('Por favor, proporciona el DDI y el número en el formato correcto: /ban {ddi} {number}');
        return;
    }
    const [ddi, number] = args;
    axios.post(`https://api-ricardo-whatsapp.onrender.com/dropNumber?ddi=${ddi}&number=${number}`)
        .then(() => ctx.reply('Número eliminado exitosamente.'))
        .catch(() => ctx.reply('Ocurrió un error al intentar eliminar el número.'));
}

function renaper(ctx) {
    if (!isWhitelisted(ctx.from.id)) {
        ctx.reply("No estás autorizado");
        return;
    }
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 2) {
        ctx.reply("Formato incorrecto. Debe ser /renaper DNI [M/F]");
        return;
    }
    const [dni, sexo] = args;
    if (dni.length !== 8) {
        ctx.reply("DNI inválido.");
        return;
    }
    if (!["M", "F"].includes(sexo.toUpperCase())) {
        ctx.reply("Género inválido.");
        return;
    }
    ctx.reply("Buscando...");
    axios.get(`https://ricardoaplicaciones-github-io.onrender.com/api/federador/${dni}/${sexo}`)
        .then(response => {
            const data = response.data;
            if ("data" in data && "sisa" in data.data) {
                const sisa_data = data.data.sisa;
                let message = "```\nInforme Comercial\n\nDatos Básicos:\n";
                message += `• DNI: ${sisa_data.nroDocumento}\n`;
                message += `• Nombre: ${sisa_data.nombre}\n`;
                message += `• Apellido: ${sisa_data.apellido}\n`;
                message += `• Fecha de Nacimiento: ${sisa_data.fechaNacimiento}\n`;
                message += `• Sexo: ${sisa_data.sexo}\n`;
                message += `• Estado Civil: ${sisa_data.estadoCivil}\n\n`;

                message += "Domicilio y Ubicación:\n";
                message += `• Domicilio: ${sisa_data.domicilio}\n`;
                message += `• Localidad: ${sisa_data.localidad}\n`;
                message += `• Código Postal: ${sisa_data.codigoPostal}\n`;
                message += `• Provincia: ${sisa_data.provincia}\n`;
                message += `• País de Nacimiento: ${sisa_data.paisNacimiento}\n\n`;

                message += "Datos Médicos:\n";
                sisa_data.cobertura.forEach(cobertura => {
                    message += `- Tipo de Cobertura: ${cobertura.tipoCobertura}\n`;
                    message += `  • Nombre Obra Social: ${cobertura.nombreObraSocial}\n`;
                    message += `  • RNOs: ${cobertura.rnos}\n`;
                    message += `  • Vigencia Desde: ${cobertura.vigenciaDesde}\n`;
                    message += `  • Fecha de Actualización: ${cobertura.fechaActualizacion}\n`;
                    message += `  • Origen: ${cobertura.origen}\n\n`;
                });

                message += "Fuente: Ministerio de Salud\n```";
                ctx.replyWithMarkdown(message);
            } else {
                ctx.reply("Hubo un error al obtener los datos personales.");
            }
        })
        .catch(error => ctx.reply(`Error interno del servidor: ${error.message}, utilice el comando /restart`));
}

function restart(ctx) {
    // Realiza la solicitud GET con axios
    axios.get('https://ricardoaplicaciones-github-io.onrender.com/api/federador/1344/F', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-A125U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/90.0.4430.91 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/316.0.0.54.116;]'
        }
    })
    .then(response => {
        // Envía un mensaje al usuario con el resultado
        ctx.reply(`Se reinició de manera exitosa.`);
    })
    .catch(error => {
        // Manejo de errores
        ctx.reply(`Se reinició de manera exitosa.`);
    });
}

function menu(ctx) {
    ctx.reply(
        "BOT ACTIVO 24/7\n" +
        "-----------------------------\n" +
        "• Comandos:\n" +
        "  /dni [DNI] [M/F] - Consulta por DNI\n" +
        "  /nombre [Nombre/Razón Social] - Búsqueda por Nombre/Razón Social\n" +
        "  /restart - Reiniciar el Bot en caso de fallo\n" +
        "-----------------------------\n" +
        "Para más información, contacte con soporte."
    );
}

function sendLogMessage(message) {
    bot.telegram.sendMessage(logChatId, message);
}

// Nuevo comando /nombre
function buscarNombre(ctx) {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
        return ctx.reply('Por favor, proporciona un nombre para buscar.');
    }

    // Construir el payload
    const payload = `Texto=${encodeURIComponent(query)}&Tipo=-1&EdadDesde=-1&EdadHasta=-1&IdProvincia=-1&Localidad=&recaptcha_response_field=enganoial+captcha&recaptcha_challenge_field=enganoial+captcha&encodedResponse=`;

    ctx.reply("Buscando...");

    axios.post('https://informes.nosis.com/Home/Buscar', payload, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        // Enviar log de la respuesta
        sendLogMessage(`Respuesta recibida: ${JSON.stringify(response.data)}`);

        // Procesar la respuesta
        if (response.data && response.data.EntidadesEncontradas && response.data.EntidadesEncontradas.length > 0) {
            const messages = response.data.EntidadesEncontradas.map(result => {
                return `
Documento: ${result.Documento}
Razón Social: ${result.RazonSocial}
Actividad: ${result.Actividad}
Provincia: ${result.Provincia}
URL Informe: ${result.UrlInforme}
URL Clon: ${result.UrlClon}
                `;
            });
            ctx.reply(messages.join('\n\n'));
        } else {
            ctx.reply('No se encontraron resultados.');
        }
    })
    .catch(error => {
        console.error('Error al buscar el informe:', error);

        // Enviar log del error
        sendLogMessage(`Error al buscar el informe: ${error.message}`);

        ctx.reply('Ocurrió un error al buscar el informe.');
    });
}

const bot = new Telegraf('7184775511:AAHh1xK9HzJ03vOQxcrGISM0ZXW-EZJUTfk');

bot.command('restart', restart);
bot.command('dni', renaper);
bot.command('start', menu);
bot.command('nombre', buscarNombre);

// Comando para agregar a la lista blanca, restringido a un ID específico
bot.command('whitelist', (ctx) => {
    if (ctx.from.id !== 6706461325) {
        ctx.reply('No estás autorizado para agregar usuarios a la lista blanca.');
        return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 1) {
        ctx.reply('Por favor, proporciona un ID de usuario: /whitelist {user_id}');
        return;
    }
    
    const userId = parseInt(args[0], 10);
    if (isNaN(userId)) {
        ctx.reply('ID de usuario inválido.');
        return;
    }
    
    addToWhitelist(ctx, userId);
});

bot.launch({
    webhook: {
        domain: 'https://renaper.onrender.com',
        port: 3000
    }
});
