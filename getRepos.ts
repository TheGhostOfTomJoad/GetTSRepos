#!/usr/bin/env node
import { Octokit } from "@octokit/rest";

import { throttling } from "@octokit/plugin-throttling";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";


import fetch from 'node-fetch';
import fs from 'fs';

const MyOctokit = Octokit.plugin(
        throttling,
        paginateRest,
        restEndpointMethods
      );



const octokit = new MyOctokit({
        headers: {
          Accept: "application/vnd.github.preview",
        },
        throttle: {
          onRateLimit: (retryAfter: any, options: { method: any; url: any; request: { retryCount: number; }; }, octokit: { log: { warn: (arg0: string) => void; info: (arg0: string) => void; }; }) => {
            octokit.log.warn(
              `Request quota exhausted for request ${options.method} ${options.url}`
            );
    
            if (options.request.retryCount === 0) {
              // only retries once
              octokit.log.info(`Retrying after ${retryAfter} seconds!`);
              return true;
            }
          },
          onAbuseLimit: (retryAfter: any, options: { method: any; url: any; }, octokit: { log: { warn: (arg0: string) => void; }; }) => {
            // does not retry, only logs a warning
            octokit.log.warn(
              `Abuse detected for request ${options.method} ${options.url}`
            );
          },
        },
      });

//const octokit = new Octokit();

const queryString = ('language:typescript');
const parameters = { q: queryString };


const iterator = octokit.paginate.iterator(octokit.rest.search.repos, parameters)

fs.mkdirSync('./ts-repos', { recursive: true })
let counter = 1;
let maxPages = 1;
for await (const r of iterator) {



        if (counter <= maxPages) {
                console.log("iteration\n")
                let responseData = r.data

                let archive_format = "zipball";
                let ref = "/master";
                let replcaceVars = ((s: string) => (s.replace("{archive_format}", archive_format)).replace("{/ref}", ref));
                let namesUrls: string[][] = responseData.map(element => [element.name, replcaceVars(element.archive_url)]

                );
                console.log(namesUrls.toString())
                // namesUrls.forEach(nameURL => {
                //         fetch(nameURL[1]).then(res => {
                //                 if (res.body) {
                //                         res.body.pipe(fs.createWriteStream(`./ts-repos/${nameURL[0]}.zip`))
                //                 }
                //         })

                // });
                namesUrls.forEach(nameURL => {
                        try {
                                fetch(nameURL[1]).then(res => {
                                        if (res.body) {
                                                res.body.pipe(fs.createWriteStream(`./ts-repos/${nameURL[0]}.zip`))
                                        }
                                        else{console.log("no response body")}
                                }).catch((x ) => console.log(`can't fetch${nameURL[1]}` + x.stack ))

                        } catch (error) {
                                console.log(`can't fetch${nameURL[1]}`)
                        }


                });
                counter++;
                

        }


}


