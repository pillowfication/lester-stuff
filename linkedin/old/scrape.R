suppressPackageStartupMessages(library(RCurl))
suppressPackageStartupMessages(library(readr))
suppressPackageStartupMessages(library(XML))

getGoogleURL <- function (search.term, domain = '.com', quotes = TRUE) {
  search.term <- gsub(' ', '%20', search.term)
  if (quotes)
    search.term <- paste('%22', search.term, '%22', sep = '')
  getGoogleURL <- paste('http://www.google', domain, '/search?q=', search.term, sep = '')
}

getGoogleLinks <- function (google.url) {
  doc <- getURL(google.url, httpheader = c("User-Agent" = "R (2.10.0)"))
  html <- htmlTreeParse(doc, useInternalNodes = TRUE, error = function (...) {})
  nodes <- getNodeSet(html, "//h3[@class='r']//a")
  return(sapply(nodes, function (x) x <- xmlAttrs(x)[["href"]]))
}

getGoogleTop <- function (google.url) {
  doc <- getURL(google.url, httpheader = c("User-Agent" = "R (2.10.0)"))
  html <- htmlTreeParse(doc, useInternalNodes = TRUE, error = function (...) {})
  nodes <- getNodeSet(html, "//h3[@class='r']//a")
  return(html)
}

#########
## Run ##
#########

folder <- "./data/"
first <- 1 # Lines to skip (increments 1, 501, 1001, etc..)
rows <- 10 # 500 seems safe w/o google getting mad, small when debugging
read_file <- paste(folder, "Test.csv", sep = "")
deets_file <- paste(folder, first, "deets_test.csv", sep = "")
links_file <- paste(folder, first, "links_test.csv", sep = "")
names <- read_lines(read_file, n_max = rows, skip = first)
quotes <- "FALSE"

a <- c()
list <- c()
ilist <- c()

counter <- 1

for (line in names) {
  print(paste(Sys.time(), counter, line, sep = " | "))
  search.term <- " "
  search.term <- paste(search.term, line[1:1], "UC Davis", "LinkedIn", sep = " ")
  search.url <- getGoogleURL(search.term = search.term, quotes = quotes)

  links <- getGoogleLinks(search.url)
  links_short <- gsub("/url.*q=", "", links)
  links_short <- gsub("&sa.*$", "", links_short)
  top <- links_short[1]
  list[counter] <- top

  search_info <- getGoogleTop(search.url)
  info_list <- lapply(search_info['//div[@class="f slp"]'], xmlValue)
  top_info <- gsub(".*[1]", "", info_list[1])
  top_info <- gsub("[\r\n]", "", top_info)
  ilist[counter] <- top_info

  counter <- counter + 1
}

write.csv2(list, file = links_file, row.names = FALSE)
write.csv2(ilist, file = deets_file, row.names = FALSE)
