#!/usr/bin/env node

import * as fs from 'fs'
import * as xml2js from 'xml2js'
import * as moment from 'moment'

import { FeedConsumer } from 'poet-feed-consumer'

const privateKey = getPrivateKey(process.argv[2])

const feedConsumer = new FeedConsumer('http://alpha.po.et/api', {
  url: 'https://bitcoinmagazine.com/feed/',
  privateKey,
  feedEntries: getFeedEntries,
  fields: {
    id: getId,
    link: getLink,
    content: getContent,
    author: getAuthor,
    tags: getTags,
    name: getTitle,
    datePublished: getPublicationDate,
    mediaType: 'article',
    articleType: 'news-article',
  },
  profile: {
    name: 'BTC Media',
    displayName: 'BTC Media',
    imageData: fs.readFileSync(__dirname + '/../img/bitcoin-magazine.urlimage').toString()
  }
})

feedConsumer.consume()

function getFeedEntries(parsedFeed: any) {
  return parsedFeed.RSS.CHANNEL[0].ITEM
}

function getId(article: any): string {
  return article.GUID[0].split('#')[1]
}

function getLink(article: any): string {
  return article.LINK[0]
}

function getContent(article: any): Promise<string> {
  const builder = new xml2js.Builder({ rootName: 'article' })
  const content = builder.buildObject(article['CONTENT:ENCODED'][0])
  return normalizeContent(content)
}

function getAuthor(article: any): string {
  return article['DC:CREATOR'].join(', ')
}

function getTags(article: any): string {
  return article.CATEGORY.join(',')
}

function getTitle(article: any): string {
  return article.TITLE[0]
}

function getPublicationDate(article: any): string {
  return '' + moment(article.PUBDATE[0]).toDate().getTime()
}

async function normalizeContent(article: any): Promise<string> {
  const content = await new Promise((resolve, reject) => {
    return xml2js.parseString(article, (err, res) => {
      if (err) {
        return reject(err)
      }
      return resolve(res)
    })
  })
  return (content as any).article
    .replace(/<(\/)?p>/gi, '\n')
    .replace(/<br\/>/gi,   '\n')
    .replace(/<[^>]+>/gi,  '')
}

function getPrivateKey(privateKeyFilePath: string) {
  if (!privateKeyFilePath) {
    console.log('Usage: poet-feeds <path-to-private-key>')
    process.exit()
  }

  if (!fs.existsSync(privateKeyFilePath)) {
    console.error(`File "${privateKeyFilePath}" not found.`)
    process.exit()
  }

  const privateKey = fs.readFileSync(privateKeyFilePath).toString().replace(/\s/g,'')

  if (!privateKey) {
    console.error(`"${privateKeyFilePath}" is empty.`)
    process.exit()
  }

  return privateKey
}