/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { formatMessage } from 'umi';

import type { UserModule } from '@/pages/User/typing';

const LoginMethodOidc: UserModule.LoginMethod = {
  id: 'oidc',
  name: formatMessage({ id: 'component.user.loginMethodOidc' }),
  render: () => {
    return (
      <></>
    );
  },
  getData(): UserModule.LoginData {
    return {};
  },
  checkData: async () => {
    return true;
  },
  submit: async (data) => {
    return {
      status: false,
      message: '',
      data: [],
      redirectTo: '/apisix/admin/oidc/login',
    }
  },
  logout: () => {
    localStorage.removeItem('token');
  },
};

export default LoginMethodOidc;
