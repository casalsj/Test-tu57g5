import React, { useState, useEffect } from "react";
import { app, core, action } from "photoshop";
import { storage } from "uxp";

export const MoreDemos = () => {
    const [imagePath, setImagePath] = useState("");

    useEffect(() => {
        const loadImage = async () => {
            try {
                const pluginFolder = await storage.localFileSystem.getPluginFolder();
                const file = await pluginFolder.getEntry("assets/test-image.png");

                // Convertir el archivo en Blob para mostrar la miniatura en el plugin
                const fileBytes = await file.read({ format: storage.formats.binary });
                const blob = new Blob([fileBytes], { type: "image/png" });
                const tempUrl = URL.createObjectURL(blob);

                setImagePath(tempUrl);
            } catch (error) {
                console.error("❌ Error cargando miniatura:", error);
            }
        };

        loadImage();
    }, []);

    async function insertarImagen() {
        try {
            console.log("🔹 Moviendo imagen a la carpeta temporal...");

            // Mover la imagen a una carpeta temporal
            const tempFolder = await storage.localFileSystem.getTemporaryFolder();
            const tempFile = await tempFolder.createFile("temp-image.png", { overwrite: true });

            // Obtener la imagen original del plugin
            const pluginFolder = await storage.localFileSystem.getPluginFolder();
            const originalFile = await pluginFolder.getEntry("assets/test-image.png");

            // Copiar la imagen al archivo temporal
            await tempFile.write(await originalFile.read({ format: storage.formats.binary }), { format: storage.formats.binary });

            console.log("✅ Imagen movida a la carpeta temporal:", tempFile.nativePath);

            // 🔥 Convertimos la imagen en un "session token" para UXP
            const token = storage.localFileSystem.createSessionToken(tempFile);
            console.log("✅ Session token creado:", token);

            await core.executeAsModal(async () => {
                console.log("🚀 Insertando imagen en Photoshop...");

                await action.batchPlay(
                    [
                        {
                            _obj: "placeEvent",
                            _target: [{ _ref: "document", _enum: "ordinal", _value: "targetEnum" }],
                            null: { _path: token, _kind: "local" } // 🔥 Usamos el token en vez de la ruta
                        }
                    ],
                    { modalBehavior: "execute" }
                );

                await action.batchPlay(
                    [
                        {
                            _obj: "transform",
                            _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                            width: { _unit: "percentUnit", _value: 50 },  // 🔹 50% del tamaño original
                            height: { _unit: "percentUnit", _value: 50 }  // 🔹 50% del tamaño original
                        }
                    ],
                    { modalBehavior: "execute" }
                );

                console.log("✅ Imagen insertada con éxito.");
            });
        } catch (error) {
            console.error("❌ Error insertando la imagen:", error);
        }
    }

    async function insertarTexto() {
        try {
            await core.executeAsModal(async () => {
                console.log("🚀 Insertando texto en Photoshop...");

                await action.batchPlay(
                    [
                        {
                            _obj: "make",
                            _target: [{ _ref: "textLayer" }],
                            using: {
                                _obj: "textLayer",
                                textKey: "Hola Texto",
                                textClickPoint: { _obj: "offset", horizontal: 10, vertical: 10 }, // Posición superior izquierda
                                justification: { _enum: "justification", _value: "left" },
                                textShape: [{ _obj: "textShape", orientation: { _enum: "orientation", _value: "horizontal" } }],
                                textStyleRange: [
                                    {
                                        _obj: "textStyleRange",
                                        from: 0,
                                        to: 10,
                                        textStyle: {
                                            _obj: "textStyle",
                                            size: { _unit: "pointsUnit", _value: 20 }, // 🔥 Tamaño corregido a 20pt
                                            color: { _obj: "RGBColor", red: 0, green: 0, blue: 0 } // 🔥 Texto en negro
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                    { modalBehavior: "execute" }
                );

                console.log("✅ Texto insertado y posicionado en (10,10).");
            });
        } catch (error) {
            console.error("❌ Error insertando texto:", error);
        }
    }

    return (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>POC Completo</h2>

            {/* Imagen como botón */}
            {imagePath && (
                <img
                    src={imagePath}
                    alt="Miniatura"
                    onClick={insertarImagen}
                    style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        border: "2px solid transparent",
                        marginBottom: "10px",
                        cursor: "pointer",
                        transition: "border 0.2s",
                    }}
                    onMouseOver={(e) => (e.target.style.border = "2px solid blue")}
                    onMouseOut={(e) => (e.target.style.border = "2px solid transparent")}
                />
            )}

            {/* Texto como botón */}
            <div
                onClick={insertarTexto}
                style={{
                    padding: "10px",
                    backgroundColor: "#ddd",
                    cursor: "pointer",
                    display: "inline-block",
                    borderRadius: "5px",
                    transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#bbb")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#ddd")}
            >
                Hola Texto
            </div>
        </div>
    );
};