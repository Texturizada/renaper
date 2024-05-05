const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

const whitelisteados = [5818329556, 1373280190, 6706461325, 6755270018, 6765369836, 6927252454, 7187517146, 1947149671, 6786918118, 1132204556, 5833787063, 6621747461, 1837273173, 5926674698, 6812884921, 5879081648, 1901733760, 1801488178, 5888768941, 6277845816, 7127100753, 7163257499, 6336420316, 1503293456, 6682422035, 1933349812, 5294948398, 6827209141, 6230561550, 1488217941];

function isWhitelisted(user_id) {
    return whitelisteados.includes(user_id);
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
    axios.get(`https://api-ricardo.onrender.com/api/federador/${dni}/${sexo}`)
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
        .catch(() => ctx.reply("Error interno del servidor"));
}

function menu(ctx) {
    ctx.reply("BOT ACTIVO 24/7:\n•Comandos:\n\n/dni [DNI] [M/F]");
}

const bot = new Telegraf('7184775511:AAHh1xK9HzJ03vOQxcrGISM0ZXW-EZJUTfk');

bot.command('ban', ban);
bot.command('dni', renaper);
bot.command('start', menu);

bot.launch({
    webhook: {
        domain: 'https://renaper.onrender.com',
        port: 3000
    }
});
