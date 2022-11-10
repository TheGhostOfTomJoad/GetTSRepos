#!/usr/bin/env node
import { Octokit } from "@octokit/rest";


console.log("1");

const octokit = new Octokit();

//const queryString = 'q=' + encodeURIComponent('language:typescript');
const queryString = ('language:typescript');
// console.log("1")


const response = octokit.rest.search.repos({ q: queryString });
// console.log("2")

let urls: string[] = [];
// // ,per_page: 1, page : 1
// //console.log((await response).data.items)
// console.log("3")



(await response).data.items.forEach(element => {
        console.log(element.html_url);
        urls.push(element.html_url)
})


console.log(urls.length);



//let itemsInResponse = await (response.then( x => x.data).then(x => x.items ))




//console.log(urls[0])

//console.log(response.data.items)