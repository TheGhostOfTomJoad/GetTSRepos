#!/usr/bin/env node
import { Octokit } from "@octokit/rest";
import fetch from 'node-fetch';
import fs from 'fs';



const octokit = new Octokit();

const queryString = ('language:typescript');
const parameters = { q: queryString };


const iterator = octokit.paginate.iterator(octokit.rest.search.repos, parameters)

fs.mkdirSync('./ts-repos', { recursive: true })

for await (const r of iterator) {
        console.log("iteration\n")
        let responseData = r.data

        let archive_format = "zipball";
        let ref = "/master";
        let replcaceVars = ((s: string) => (s.replace("{archive_format}", archive_format)).replace("{/ref}", ref));
        let namesUrls : string[][] = responseData.map(element => [element.name ,replcaceVars(element.archive_url)]

        );
        console.log(namesUrls.toString())
        namesUrls.forEach(nameURL => {
                fetch(nameURL[1]).then(res => { if (res.body){
                        res.body.pipe(fs.createWriteStream(`./ts-repos/${nameURL[0]}.zip`))}} )
                
        });



}


