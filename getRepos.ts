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


async function* getLinksAndNames(maxPages: number) {//: AsyncGenerator<string[][]> {
  const queryString = ('language:typescript');
  const parameters = { q: queryString };
  const iterator = octokit.paginate.iterator(octokit.rest.search.repos, parameters)


  let counter = 0;
  // let maxPages = 5;
  for await (const r of iterator) {
    if (counter <= maxPages) {
      console.log("new page\n")
      let responseData = r.data
      let archive_format = "zipball";
      let ref = "/master";
      let replcaceVars = ((s: string) => (s.replace("{archive_format}", archive_format)).replace("{/ref}", ref));
      let namesUrlsPage: [string, string][] = responseData.map(element => [element.name, replcaceVars(element.archive_url)]);
      yield (namesUrlsPage);
      counter++;
    }
    else { return; }
  }
}

async function toArray<T>(asyncIterator: AsyncGenerator<T>) {
  const arr = [];
  for await (const i of asyncIterator) arr.push(i);
  return arr;
}

async function downloadZIPs(namesUrlsPages: AsyncGenerator<[string, string][], void, unknown>): Promise<void> {
  await fs.promises.mkdir('./ts-repos', { recursive: true });
  //let counter = 0;

  for await (const nameURLPage of namesUrlsPages) {

    // let namesUrlsPagesArray = toArray (namesUrlsPages);
    // console.log((await namesUrlsPagesArray).length);
    //console.log("page loop")
    //console.log(namesUrlsPages.next())
    for (const nameURL of nameURLPage) {
      //console.log("\n" + nameURL + "\n")
      //console.log("link name loop")
      try {
        fetch(nameURL[1]).then(res => {
          if (res.body) {
            res.body.pipe(fs.createWriteStream(`./ts-repos/${nameURL[0]}.zip`))
          }
          else { console.log("no response body") }
        }).catch((x) => console.log(`can't fetch1 ${nameURL[1]}` + " " + x.stack))

      }
      catch (error) {
        console.log(`can't fetch2 ${nameURL[1]}`)
      }
      console.log("finished inner loop step")
    }
    console.log("finished outer loop step")
    //console.log(counter,maxPages)
    // if (counter >= maxPages) { 
    //   break;
    // }
    // counter++;
    // continue;
  }
  console.log("finished outer loop")
  return;
}



async function main(): Promise<void> {
  await downloadZIPs(getLinksAndNames(3));
  console.log("finished")
  process.exit(0);
}


async function testGetLinkAndNames() {
  for await (const iterator of getLinksAndNames(1)) {
    console.log("hello")
  }
}

await main();

//await getLinksAndNames(1);
//for await (const r of iterator) {



//   if (counter <= maxPages) {
//     console.log("iteration\n")
//     let responseData = r.data

//     let archive_format = "zipball";
//     let ref = "/master";
//     let replcaceVars = ((s: string) => (s.replace("{archive_format}", archive_format)).replace("{/ref}", ref));
//     let namesUrls: string[][] = responseData.map(element => [element.name, replcaceVars(element.archive_url)]

//     );
//     console.log(namesUrls.toString())
//     // namesUrls.forEach(nameURL => {
//     //         fetch(nameURL[1]).then(res => {
//     //                 if (res.body) {
//     //                         res.body.pipe(fs.createWriteStream(`./ts-repos/${nameURL[0]}.zip`))
//     //                 }
//     //         })

//     // });
//     namesUrls.forEach(nameURL => {
//       try {
//         fetch(nameURL[1]).then(res => {
//           if (res.body) {
//             res.body.pipe(fs.createWriteStream(`./ts-repos/${nameURL[0]}.zip`))
//           }
//           else { console.log("no response body") }
//         }).catch((x) => console.log(`can't fetch${nameURL[1]}` + x.stack))

//       } catch (error) {
//         console.log(`can't fetch${nameURL[1]}`)
//       }


//     });
//     counter++;


//   }


// }

