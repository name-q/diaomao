// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportWebhook = require('../../../app/controller/webhook');

declare module 'egg' {
  interface IController {
    webhook: ExportWebhook;
  }
}
