import { Request } from 'express';
import * as jsforce from 'jsforce';
import { SObjectDescribe, SObject } from '../../typings/metadata';

const DynamicTestClassName = 'SFDynamicRecordTestingClass';

export interface Log {
    id: number;
    time: string;
    code: string;
    content: string;
    isDebug: boolean;
    children?: Log[];
}

export class SalesforceService {

    oauth2 = new jsforce.OAuth2({
        clientId: process.env.SF_CONSUMER_KEY,
        clientSecret: process.env.SF_CONSUMER_SECRET
    });

    constructor() {
        if (!process.env.SF_CONSUMER_KEY || !process.env.SF_CONSUMER_SECRET) {
            throw 'Error: Missing Salesforce Connected App Credentials';
        }
        if (!process.env.DEMO_USER || !process.env.DEMO_USER_PASSWORD || !process.env.DEMO_USER_SECURITY_TOKEN) {
            throw 'Error: Missing Salesforce Demo User Credentials';
        }
    }

    getAuthorizationUrl(isSandbox: boolean, redirectUri: string) {
        this.oauth2.redirectUri = redirectUri;
        this.oauth2.loginUrl = `https://${isSandbox ? 'test' : 'login'}.salesforce.com/`;
        return this.oauth2.getAuthorizationUrl({}).replace('login', isSandbox ? 'test' : 'login');
    }

    async completeLogin(code: string): Promise<{userInfo: jsforce.UserInfo, conn: jsforce.Connection}> {
        const conn = new jsforce.Connection({oauth2: this.oauth2});
        let userInfo = await conn.authorize(code);
        return {userInfo: userInfo, conn: conn};
    }

    async loginToDemo(): Promise<{userInfo: jsforce.UserInfo, conn: jsforce.Connection}> {
        const conn = new jsforce.Connection({loginUrl: 'https://login.salesforce.com/'});
        let userInfo = await conn.login(process.env.DEMO_USER, process.env.DEMO_USER_PASSWORD + process.env.DEMO_USER_SECURITY_TOKEN);
        return {userInfo: userInfo, conn: conn};
    }

    async setSessionAuthentication(req: Request, userInfo: jsforce.UserInfo, conn: jsforce.Connection) {
        let chatterInfo: any = await conn.chatter.resource('/users/me').retrieve();
        req.session = {
            authentication: {
                accessToken: conn.accessToken,
                refreshToken: (conn as any).refreshToken, // Missing type in @types/jsforce
                instanceUrl: conn.instanceUrl,
                userId: userInfo.id,
                organizationId: userInfo.organizationId
            },
            chatterInfo: chatterInfo
        }
        console.log('Session', req.session);
    }

    getSanitizedSession(req: Request) {
        let session = JSON.parse(JSON.stringify(req.session));
        delete session.authentication;
        return session;
    }

    private createConnection(session): jsforce.Connection {
        return new jsforce.Connection({
            accessToken: session.authentication.accessToken,
            instanceUrl: session.authentication.instanceUrl
        });
    }

    async getAllSObjects(session): Promise<SObjectDescribe[]> {
        try {
            let res: any = await this.createConnection(session).describeGlobal();
            return res.sobjects.filter(sobject => sobject.createable);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async getSObject(session, sObject: string): Promise<SObject> {
        try {
            let res: any = await this.createConnection(session).sobject(sObject).describe();
            res.fields = res.fields.filter(field => field.createable && field.updateable);
            res.fields.forEach(field => {
                if (field.type === 'picklist') console.log(field);
            })
            return res;
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async executeDynamicTest(session, steps, recursive?: boolean): Promise<Log[] | void> {
        const conn = this.createConnection(session);
        const queryString = `Name = '${DynamicTestClassName}'`;
        let classId;
        try {
            // Optionally, a template can be passed in, so check if that's the case before generating it again
            let template = typeof steps === 'string' ? steps : this.generateTemplate(steps);
            // Create the class in Salesforce
            let res: any;
            try {
                console.log(template);
                console.log('Creating Apex Class');
                res = await conn.tooling.sobject('ApexClass').create({
                    body: template
                });
                // If it already exists, delete it and try again
            } catch (err) {
                console.log('Failed to create Apex Class');
                // Only allow one reattempt
                if (recursive) throw err;
                console.log('Finding Apex Class');
                res = await conn.tooling.sobject('ApexClass').findOne(`Name = '${DynamicTestClassName}'`);
                console.log('Deleting Apex Class');
                if (!res || !res.Id) {
                    console.log(err);
                    return this.executeDynamicTest(template, true);
                }
                await conn.tooling.sobject('ApexClass').delete(res.Id);
                console.log('Deleted Apex Class\nRerunning function');
                return this.executeDynamicTest(template, true);
            }
            classId = res.id;
            console.log('Finding Debug Level');
            res = await conn.tooling.sobject('DebugLevel').findOne(`DeveloperName = 'Log_Dynamic_Metrics_Gatherer'`);
            if (res && res.Id) {
                console.log('Deleting Debug Level');
                await conn.tooling.sobject('DebugLevel').delete(res.Id);
            }
            console.log('Creating Debug Level');
            res = await conn.tooling.sobject('DebugLevel').create({
                ApexCode: 'DEBUG',
                ApexProfiling: 'INFO',
                Callout: 'INFO',
                Database: 'INFO',
                DeveloperName: 'Log_Dynamic_Metrics_Gatherer',
                language: 'en_US',
                MasterLabel: 'Log_Dynamic_Metrics_Gatherer',
                System: 'INFO',
                Validation: 'INFO',
                Visualforce: 'INFO',
                Workflow: 'INFO'
            });
            console.log('Created debug level', res);
            let debugLevelId = res.id;
            console.log('Finding Trace Flag');
            res = await conn.tooling.sobject('TraceFlag').findOne(`TracedEntityId = '${session.authentication.userId}'`);
            console.log(res);
            if (res && res.Id) {
                console.log('Deleting Trace Flag');
                await conn.tooling.sobject('TraceFlag').delete(res.Id);
            }
            let time = new Date();
            time.setMinutes(time.getMinutes() + 5);
            console.log('Creating Trace Flag');
            console.log(classId);
            res = await conn.tooling.sobject('TraceFlag').create({
                ApexCode: 'DEBUG',
                ApexProfiling: 'INFO',
                Callout: 'INFO',
                Database: 'INFO',
                DebugLevelId: debugLevelId,
                ExpirationDate: time.toISOString(),
                LogType: 'DEVELOPER_LOG',
                System: 'INFO',
                TracedEntityId: session.authentication.userId,
                Validation: 'INFO',
                Visualforce: 'INFO',
                Workflow: 'INFO'
            });
            // Execute its test method
            let req: any = {
                method: 'POST',
                url: '/services/data/v42.0/tooling/runTestsSynchronous',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tests: [
                        {
                            'className': DynamicTestClassName
                        }
                    ]
                })
            };
            console.log('Executing Test Synchronously');
            res = await conn.request(req);
            if (!res.successes || !res.successes[0]) {
                throw (res.failures);
            }
            console.log('Finding Apex Log');
            let debugLog = await conn.request(`/sobjects/ApexLog/${res.apexLogId}/Body`);
            // Clean up the test class
            try {
                console.log('Deleting Apex Class after success');
                res = await conn.tooling.sobject('ApexClass').delete(classId);
                console.log(res);
            } finally {
                let body = await this.parseLog(debugLog.toString());
                console.log('got this body', body);
                return Promise.resolve(body);
            }
        } catch (err) {
            console.log('An error occurred while executing the dynamic ApexClass', err);
            // Clean up class even if it still exists
            if (classId) {
                try {
                    console.log('Deleting Apex Class after failure');
                    await conn.tooling.sobject('ApexClass').delete(classId);
                } catch (_) {
                    console.log('Failed to delete Apex Class', _);
                    return Promise.reject(err);
                }
            }
            return Promise.reject(err);
        }
    }

    // Who needs code quality? What even is refactoring?
    parseLog(log: string): Promise<Log[]> {

        var lineNumber = 0;
        var parsed: Log[] = [];

        let lines: string[] = log.split('\n');
        for (let line of lines) {

            line = line.replace(/"/g, '\'');

            lineNumber++;
            if (lineNumber === 1 || line === '') continue;

            // Get time
            let i: number = line.indexOf(' ');
            let time: string = line.substring(0, i);

            // Remove id
            line = line.replace(/(\(\d+\)\|)/, '');
            line = line.substring(i + 1);

            // Get code
            let max: number = line.indexOf('[');
            max = line.indexOf('(') > max ? line.indexOf('(') : max;
            let codes: string[];
            let l: number = (line.match(/\|/g) || []).length
            switch ((line.match(/\|/g) || []).length) {
                case 0:
                    codes = [];
                    break;
                case 1:
                    codes = [line.substring(0, line.indexOf('|'))];
                    break;
                default:
                    codes = line.split(/\|/);
            }
            let code: string = codes[0] || line.replace('|', '');
            line = line.replace(code, '');
            line = line.replace('|', '');

            let debug: boolean = line.indexOf('|DEBUG|') >= 0;

            parsed.push({
                id: lineNumber,
                time: time,
                code: code,
                content: line,
                isDebug: debug
            });
        }

        let index = 0;
        let i = 0;
        let tree: Log[] = [parsed[0]];
        while (i < parsed.length) {
            if (parsed[i].code === 'EXECUTION_STARTED') {
                index = i;
                tree.push(parseBlock('EXECUTION'));
                console.log('returning tree', tree);
                return Promise.resolve(tree);
            }
            i++;
        }
        return Promise.reject('Debug log did not have EXECUTION_STARTED');

        function parseBlock(type: string, block?: Log): Log {
            let line = parsed[index];
            if (!block) {
                block = line;
                block.children = [];
            }
            while (index < parsed.length) {
                line = parsed[index];
                if (isBlockStart(line.code, type)) {
                    console.log('begin ' + index, line.code);
                } else if (isBlockEnd(line.code, type)) {
                    console.log('end ' + index, line.code);
                    index++;
                    block.children.push(line);
                    return block;
                } else {
                    if (isBlockStart(line.code)) {
                        block.children.push(parseBlock(line.code.replace('_BEGIN', '').replace('_STARTED', '').replace('_ENTRY', '')));
                        continue;
                    } else {
                        block.children.push(line);
                    }
                }
                index++;
            }
            return block;
        }

        function isBlockStart(code: string, type?: string): boolean {
            type = type || '';
            const suffices = [
                '_BEGIN',
                '_STARTED',
                '_ENTRY'
            ];
            const ignoredTypes = [
                'VARIABLE_SCOPE_BEGIN',
                'WF_SPOOL_ACTION_BEGIN'
            ];
            let isStart = false;
            for (let suffix of suffices) {
                if (code.indexOf(type + suffix) >= 0) isStart = true;
            }
            if (ignoredTypes.indexOf(code) >= 0) isStart = false;
            return isStart;
        }

        function isBlockEnd(code: string, type: string): boolean {
            type = type || '';
            const suffices = [
                '_END',
                '_FINISHED',
                '_EXIT'
            ];
            var isEnd = false;
            for (var suffix of suffices) {
                if (code.indexOf(type + suffix) >= 0) isEnd = true;
            }
            return isEnd;
        }
    }

    // Yes, this is a 61 line long template literal with a doubly nested for loop
    // and a ternary operation for dynamically selecting the template within the template.
    // Javascript baby!
    generateTemplate(steps): string {
        const classname: string = DynamicTestClassName;
        steps.map((step, j) => {
            console.log(step);
            console.log(typeof step);
        });
        return `
        @isTest
        public class ${classname} {
        
            @isTest
            public static void test() {
                ${steps.map((step, j) => {
                    // Iterate over each step
            
                    // If this is an insert, use the insert template
                    return step.type === 'insert' ?
                    `${step.datatype} ${step.variable} = new ${step.datatype}();
                    ${step.fields.map((item, i) => 
                        {
                            // Write this for each field
                            // Try to directly reference the field/value so that things like assigning lookup IDs will work
                            // If it fails, try to use the put method. The put method is likely to mess up data types.
                            return `try {
                                ${step.variable}.${step.fields[i]} = '${step.values[i]}';
                            } catch (Exception e) {
                                ${step.variable}.put('${step.fields[i]}', '${step.values[i]}');
                            }`
                        }).join(`\n`)
                    }
            
                    System.debug('SFDYNAMICTESTINGFLAG [BEFORE INSERT]: ${step.datatype} ${step.variable} = ' + ${step.variable});
                    insert ${step.variable};
            
                    DescribeSObjectResult describeResult = ${step.variable}.Id.getSObjectType().getDescribe();	
                    List<String> fieldNames = new List<String>(describeResult.fields.getMap().keySet());	
                    String query = 'select ' + String.join(fieldNames, ',') + ' from ' + describeResult.getName() +
                    ' where ' + ' Id = \\'' + ${step.variable}.Id + '\\'' + ' limit 1';
            
                    System.debug('SFDYNAMICTESTINGFLAG [AFTER INSERT]: ${step.datatype} ${step.variable} = ' + Database.query(query));`
            
            
                    : // Otherwise, use the update template
            
            
                    `${step.fields.map((item, i) => 
                        {
                            // Write this for each field
                            // Try to directly reference the field/value so that things like assigning lookup IDs will work
                            // If it fails, try to use the put method. The put method is likely to mess up data types.
                            return `try {
                                ${step.variable}.${step.fields[i]} = ${step.values[i]};
                            } catch (Exception e) {
                                ${step.variable}.put(${step.fields[i]}, ${step.values[i]});
                            }`
                        }).join(``)
                    }
                    
                    System.debug('SFDYNAMICTESTINGFLAG [BEFORE UPDATE]: ${step.datatype} ${step.variable} = ' + ${step.variable});
                    update ${step.variable}
                    
                    DescribeSObjectResult describeResult = ${step.variable}.Id.getSObjectType().getDescribe();	
                    List<String> fieldNames = new List<String>(describeResult.fields.getMap().keySet());	
                    String query = 'select ' + String.join(fieldNames, ',') + ' from ' + describeResult.getName() +
                    ' where ' + ' Id = \\'' + ${step.variable}.Id + '\\'' + ' limit 1';
                    
                    System.debug('SFDYNAMICTESTINGFLAG [AFTER UPDATE]: ${step.datatype} ${step.variable} = ' + Database.query(query));`;
                })}
            }
        
        }`;
    }
}