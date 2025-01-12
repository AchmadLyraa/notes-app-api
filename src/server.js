const Hapi = require("@hapi/hapi");
const ClientError = require("./exceptions/ClientError");

const notes = require("./api/notes");
const NotesService = require("./services/postgres/NotesService");
const NotesValidator = require("./validator/notes");

// users
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

require("dotenv").config();

const init = async () => {
	const notesService = new NotesService();
	const usersService = new UsersService();

	const server = Hapi.server({
		port: process.env.PORT,
		host: process.env.HOST,
		routes: {
			cors: {
				origin: ["*"],
			},
		},
	});

	await server.register([
		{
			plugin: notes,
			options: {
				service: notesService,
				validator: NotesValidator,
			},
		},
		{
			plugin: users,
			options: {
				service: usersService,
				validator: UsersValidator,
			},
		},
	]);

	server.ext("onPreResponse", (request, h) => {
		const { response } = request;
		if (response instanceof ClientError) {
			const newResponse = h.response({
				status: "fail",
				message: response.message,
			});
			newResponse.code(response.statusCode);
			return newResponse;
		}
		if (response instanceof Error) {
			console.error(response);
			const newResponse = h.response({
				status: "error",
				message: "Terjadi kegagalan pada server kami",
			});
			newResponse.code(500);
			return newResponse;
		}

		return h.continue;
	});

	await server.start();
	console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
