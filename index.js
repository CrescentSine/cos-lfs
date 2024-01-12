import config from "config";
import COS from "cos-nodejs-sdk-v5";
import fastify from "fastify";

const cos = new COS({
    SecretId: config.get("secretId"),
    SecretKey: config.get("secretKey"),
});

const server = fastify({
    logger: true,
});

server.addContentTypeParser("application/vnd.git-lfs+json", { parseAs: "buffer" }, server.getDefaultJsonParser('ignore', 'ignore'));

server.post("/objects/batch", (req, resp) => {
    const respData = {
        transfer: "basic",
        objects: [],
    };

    const expires = config.get("expires");

    switch (req.body.operation) {
        case "upload":
            respData.objects = req.body.objects.map(({oid, size}) => {
                return {
                    oid,
                    size,
                    authenticated: true,
                    actions: {
                        upload: {
                            href: cos.getObjectUrl({
                                Bucket: config.get("cosBucket"),
                                Region: config.get("cosRegion"),
                                Key: oid,
                                Method: 'PUT',
                                Sign: true,
                                Expires: expires,
                            }),
                            header: {
                                'Content-Type': 'application/octet-stream',
                            },
                            expires_in: expires,
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
                            href: cos.getObjectUrl({
                                Bucket: config.get("cosBucket"),
                                Region: config.get("cosRegion"),
                                Key: oid,
                                Sign: true,
                                Expires: expires,
                            }),
                            expires_in: expires,
                        }
                    },
                };
            });
            break;
        default:
            console.warn("unknown operation:", req.body.operation);
            break;
    }

    resp.header("Content-Type", "application/vnd.git-lfs+json");
    resp.code(200).send(respData);
});

server.listen({
    port: config.get('serverPort'),
});
