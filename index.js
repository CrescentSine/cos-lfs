import config from "config";
import fastify from "fastify";

const server = fastify({
    logger: true,
});

server.post("/batch", (req, resp) => {
    const respData = {
        transfer: "basic",
        objects: [],
    };

    console.log("url:", req.url);
    console.log("header:", req.headers);
    console.log("body:", req.body);

    const expire = config.get("expire");

    switch (req.body.operation) {
        case "upload":
            respData.objects = req.body.objects.map(({oid, size}) => {
                return {
                    oid,
                    size,
                    authenticated: true,
                    actions: {
                        upload: {
                            href: "TODO",
                            header: {
                                'Content-Type': 'application/octet-stream',
                            },
                            expires_in: expire,
                        }
                    },
                };
            });
            break;
        case "download":
            respData.objects = req.body.objects.map(({oid, size}) => {
                return {
                    oid,
                    size,
                    authenticated: true,
                    actions: {
                        download: {
                            href: "TODO",
                            expires_in: expire,
                        }
                    },
                };
            });
            break;
        default:
            console.warn("unknown operation:", req.body.operation);
            break;
    }

    console.log("respData:", respData);

    resp.header("Content-Type", "application/vnd.git-lfs+json");
    resp.code(200).send(respData);
});

server.listen({
    port: config.get('serverPort'),
});
