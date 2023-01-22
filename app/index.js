const API_URL = 'http://localhost:3000';
let counter = 0;

async function getData(signal) {
    const response = await fetch(API_URL, {
        signal
    });

    const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJson());

    return reader;
}

//esse função vai se certificar que caso dois chunks cheguem em uma unica transmissao converta corretamente
function parseNDJson() {
    let ndjsonBuffer = '';

    return new TransformStream({
        transform(chunck, controller) {
            ndjsonBuffer += chunck;

            const items = ndjsonBuffer.split('\n');

            items.slice(0, -1)
                .forEach(item => controller.enqueue(JSON.parse(item)));

            ndjsonBuffer = items[items.length - 1];
        },
        flush(controller) {
            if(!ndjsonBuffer) return;
            controller.enqueue(JSON.parse(ndjsonBuffer));
        }
    })
}

function appendToHTML(element) {
    return new WritableStream({
        write({ title, description, url_anime }) {
            const card = `
            <article>
                <div class="text">
                    <h3>[${++counter}] ${title}</h3>
                    <p>${description.slice(0, 100)} ...</p>
                    <a href="${url_anime}" target="_blank">Read more!</a>
                </div>
            </article>
            `;

            element.innerHTML += card;
        },
        abort(reason) {
            console.log('aborted!');
        }
    })
}

const [
    start,
    stop,
    cards
] = ['start', 'stop', 'cards'].map(item => document.getElementById(item));

let abortController = new AbortController();

start.addEventListener('click', async () => {
    const readable = await getData(abortController.signal);
    readable.pipeTo(appendToHTML(cards));
});

stop.addEventListener('click', () => {
    abortController.abort();
    console.log('aborting...');
    abortController = new AbortController();
});