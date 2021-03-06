# Salesforce Log Analyzer

## Online Demo
Available [here](https://sf-log-analyzer.herokuapp.com/). Please allow the Heroku server a minute or two to start automatically after clicking.

## About

This is a hobby project that formed from an idea that occurred to me:

Given the capabilities of Salesforce's Metadata API, an external client is able to upload classes to a Salesforce org, run tests within that class, retrieve the log files generated by this test, and then do whatever it wishes with the information within those log files.

Salesforce Log Analyzer uses this concept to
1. Display logs in formats other than those available through Salesforce's Developer Console
2. Interpret logs and output information about the processes within an org

## Tech Stack

This project consists of two parts, an Express server, and an Angular 6 front-end. Both parts use Typescript throughout.

Travis-CI is used for Continuous Integration and Deployment to Heroku.

## Install and Run

The project can be installed with:
`npm i && cd server && npm i && cd ../client && npm i`

Start both the server and client by running `npm start` from the root directory.

The main app is accessible at `http://localhost:8000/`. The angular CLI will also host the angular development server at `http://localhost:4200/` which features hot reloading and error reporting.
