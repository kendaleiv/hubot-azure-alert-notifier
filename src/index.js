/**
* Description:
*   Notify for configured alert webhooks configured on Microsoft Azure.
* Dependencies:
*   None
* Configuration:
*   HUBOT_AZURE_ALERTS_TOKEN
* Commands:
*   None
* Notes:
*   This script listens for webhooks configured on the Microsoft Azure portal.
*   Configure the Microsoft Azure portal alert webhook to submit to:
*   https://example.com/hubot/azure-alert/general?token=HUBOT_AZURE_ALERTS_TOKEN_VALUE_HERE
*
*   See https://azure.microsoft.com/en-us/documentation/articles/insights-webhooks-alerts/
*   for more details.
* Author:
*   ritterim
*/

'use strict';

module.exports = (robot) => {
    robot.router.post('/hubot/azure-alert/:room', (req, res, next) => {
        if (!process.env.HUBOT_AZURE_ALERTS_TOKEN) {
            robot.logger.error('HUBOT_AZURE_ALERTS_TOKEN environment variable is not specified.');

            res.status(500);
            res.send('Configuration is required.');
        }
        else if (req.query.token !== process.env.HUBOT_AZURE_ALERTS_TOKEN) {
            robot.logger.warning(`Invalid token specified in ${req.url}.`);

            res.status(401);
            res.send('Unauthorized');
        }
        else {
            let ctx = req.body.context;

            let status = req.body.status.toLowerCase();
            let message;

            switch (status) {
                case 'activated':
                    // metricName, metricUnit, metricValue, threshold, windowSize, timeAggregation, operator
                    // only apply to metric alerts.
                    let cond = ctx.condition;
                    let metricText = cond.metricName
                      ? `(${cond.metricName} ${cond.metricUnit} of ${Math.round(cond.metricValue * 100) / 100} is ${cond.operator} threshold of ${cond.threshold}) `
                      : '';

                    message = `Microsoft Azure alert: '${ctx.name}' ${status} for ${ctx.resourceName} in ${ctx.resourceRegion}! ${metricText}${ctx.portalLink}`;

                    break;
                case 'resolved':
                    message = `Microsoft Azure alert: '${ctx.name}' ${status} for ${ctx.resourceName} in ${ctx.resourceRegion}!`;
                    break;
                default:
                    throw new Error('Unexpected status specified in Azure alert message.');
            }

            robot.send({ room: req.params.room }, message);

            res.send('ok');
        }
    });
};
