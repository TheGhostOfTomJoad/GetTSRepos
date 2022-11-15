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


async function* getLinksAndNames(pagesCount: number, perPage: number) {
  const queryString = ('language:typescript');
  const parameters = { q: queryString, per_page: perPage };
  const iterator = octokit.paginate.iterator(octokit.rest.search.repos, parameters)
  let archive_format = "zipball";
  let ref = "/master";
  let replcaceVars = ((s: string) => (s.replace("{archive_format}", archive_format)).replace("{/ref}", ref));
  let pagesCounter = 0;
  for await (const r of iterator) {
    if (pagesCounter < pagesCount) {
      let responseData = r.data
      let namesUrlsPage: [string, string, number][] = responseData.map(element => [(element.full_name).replace("/", "_"), replcaceVars(element.archive_url), element.id]);
      namesUrlsPage = [...new Set(namesUrlsPage)];
      yield (namesUrlsPage);
      pagesCounter++;
    }
    else { return; }
  }
}



async function downloadZIPs(namesUrlsPages: AsyncGenerator<[string, string, number][], void, unknown>, maxRepos: number): Promise<void> {
  await fs.promises.mkdir('./ts-repos', { recursive: true });
  let downloadedRepos = new Map<number, void>
  for await (const nameURLPage of namesUrlsPages) {
    for (const nameURL of nameURLPage) {
      if (downloadedRepos.size < maxRepos) {
        downloadedRepos.set(nameURL[2]);
        fetch(nameURL[1]).then(res => {
          if (res.body) {
            let writeStream = fs.createWriteStream(`./ts-repos/${nameURL[0]}.zip`);
            res.body.pipe(writeStream);
          }
          else { console.log("no response body"); }
        }).catch((x) => console.log(`can't fetch1 ${nameURL[1]}` + " " + x.stack))
      }
    }
  }
}


async function getTSRepos(pagesCount: number, perPage: number, maxRepos: number): Promise<void> {
  await downloadZIPs(getLinksAndNames(pagesCount, perPage), maxRepos);
  console.log("finished")
  process.exit(0);
}

function main(): void {
  getTSRepos(10, 10, 70)
}


main();