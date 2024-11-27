async function handleRequest(request, env) {
    if (request.method === 'GET') {
        return new Response(`
        <!DOCTYPE html>
        <html lang="zh">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mystery-OCR Service</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                h1 {
                    text-align: center;
                    color: #4A90E2;
                }
                .container {
                    max-width: 800px;
                    margin: auto;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                input[type="file"] {
                    margin: 10px 0;
                }
                button {
                    background-color: #4A90E2;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                button:hover {
                    background-color: #357ABD;
                }
                #response, #textResponse {
                    margin-top: 20px;
                    border: 1px solid #ccc;
                    padding: 10px;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                    max-height: 200px;
                    overflow-y: auto;
                }
                #svgContainer {
                    margin-top: 20px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    background-color: #fff;
                }
                .copy-button {
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Mystery-OCR Service</h1>
                <input type="file" id="fileInput" accept="image/*">
                <button id="uploadButton">Upload and Convert</button>
				<div id="response">No results yet. Please upload an image to see the results.</div>
				<div id="textResponse">No text results yet. Please upload an image to see the text results.</div>
                <button id="copyButton" class="copy-button">Copy Result</button>
                <button id="copyTextButton" class="copy-button">Copy Text Result</button>
                <svg id="svgContainer" width="800" height="400" xmlns="http://www.w3.org/2000/svg"></svg>
            </div>
            <script>
                document.getElementById('uploadButton').addEventListener('click', async () => {
                    const fileInput = document.getElementById('fileInput');
                    const file = fileInput.files[0];
                    if (!file) {
                        alert('请先选择一张图片！');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Data = reader.result.split(',')[1];
                        try {
                            const response = await fetch('/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ base64: base64Data })
                            });
                            const responseData = await response.json();
                            document.getElementById('response').innerText = JSON.stringify(responseData, null, 2);
                            displaySVG(responseData.data);
                            displayTextResponse(responseData.data);
                        } catch (error) {
                            document.getElementById('response').innerText = '请求失败: ' + error.message;
                        }
                    };
                    reader.readAsDataURL(file);
                });

                document.getElementById('copyButton').addEventListener('click', () => {
                    const responseText = document.getElementById('response').innerText;
                    navigator.clipboard.writeText(responseText).then(() => {
                        alert('结果已复制到剪贴板！');
                    }).catch(err => {
                        alert('复制失败: ' + err);
                    });
                });

                document.getElementById('copyTextButton').addEventListener('click', () => {
                    const textResponse = document.getElementById('textResponse').innerText;
                    navigator.clipboard.writeText(textResponse).then(() => {
                        alert('文本结果已复制到剪贴板！');
                    }).catch(err => {
                        alert('复制失败: ' + err);
                    });
                });

                function displaySVG(data) {
                    const svgContainer = document.getElementById('svgContainer');
                    svgContainer.innerHTML = ''; // Clear previous content
					if (data.length === 0) {
						svgContainer.innerHTML = '<text x="10" y="20" fill="gray">No SVG results available.</text>';
						return;
					}
                    data.forEach((item) => {
                        item.forEach((image) => {
                            const points = image.polygon.map(point => point.join(',')).join(' ');
                            const svgElement = 
                                '<polygon points="' + points + '" fill="lightblue" stroke="black" />' +
                                '<text x="' + (image.polygon[0][0] + 5) + '" y="' + (image.polygon[0][1] + 15) + '" fill="black">' + image.text + '</text>';
                            svgContainer.innerHTML += svgElement; // Add SVG element to container
                        });
                    });
                }

                function displayTextResponse(data) {
                    const textResponseDiv = document.getElementById('textResponse');
                    textResponseDiv.innerHTML = ''; // Clear previous content
				    if (data.length === 0) {
						textResponseDiv.innerHTML = 'No text results available.';
						return;
					}
                    const textContent = data.map(item => item.map(image => image.text).join(' ')).join('<br>'); // Extract text content
                    textResponseDiv.innerHTML = textContent; // Display plain text content
                }
            </script>
        </body>
        </html>
        `, { headers: { 'Content-Type': 'text/html' } });
    } else if (request.method === 'POST' && request.url.endsWith('/upload')) {
        try {
            const reqData = await request.json();
            const newReqData = {
                images: [
                    {
                        data: reqData.base64,
                        dataId: '1',
                        type: 2
                    }
                ],
                nonce: Math.floor(Math.random() * 100000),
                secretId: `${env.SECRET_ID}`, // 使用 env 参数获取 SECRET_ID
                timestamp: Date.now()
            };
            const newReqJsonBody = JSON.stringify(newReqData);
            const signature = await md5(newReqJsonBody + `${env.API_KEY}`); // 使用 env 参数获取 API_KEY
            const newReq = new Request(`${env.ENDPOINT}`, { // 使用 env 参数获取 ENDPOINT
                method: 'POST',
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    "CX-Signature": signature
                },
                body: newReqJsonBody
            });
            const response = await fetch(newReq);
            const respText = await response.text(); // 先获取文本
            let respJson;
            try {
                respJson = JSON.parse(respText); // 尝试解析 JSON
            } catch (jsonError) {
                console.error('JSON 解析错误:', jsonError);
                console.error('响应文本:', respText);
                return new Response(JSON.stringify({ error: '服务器返回的响应不是有效的 JSON 格式' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify(respJson), { headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            return new Response(JSON.stringify({ error: '处理请求时出错: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
    return new Response('Illegal request', { status: 404 });
}

async function md5(text) {
    const digest = await crypto.subtle.digest({ name: 'MD5' }, new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
    async fetch(request, env) {
        // 确保 Worker 正确传递 env 变量
        return handleRequest(request, env);
    }
};
