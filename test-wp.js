const fetch = require('node-fetch');
async function test() {
    const url = 'https://josh-blog.wasmer.app/wp-json/wp/v2/posts?per_page=50&orderby=date&order=desc&_fields=id%2Ctitle%2Cdate%2Ccontent%2Cexcerpt';
    const res = await fetch(url, { headers: { Authorization: 'Basic YWRtaW46ZW1DayBWVFQyIFowSlMgMkNobiAxb3NDIGVhVUg=' } });
    console.log(res.status);
    console.log(await res.text());
}
test();
