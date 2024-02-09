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
import './libs/iconfont';

import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import { isPlainObject } from 'lodash';
import React from 'react';
import type { RequestConfig } from 'umi';
import { history } from 'umi';

import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { errorHandler, getMenuData, getUrlQuery } from '@/helpers';
import { queryCurrent } from '@/services/user';

import defaultSettings from '../config/defaultSettings';

const getCookie = function (cookiesString: string, name: string): string | null {
  const cookies = cookiesString.split(';');
  for (let idx in cookies) {
    const cookie = cookies[idx].trim();
    if (!cookie.startsWith(name + '=')) {
      continue;
    }

    return cookie.substring((name + '=').length);
  }

  return null;
};

const deleteCookie = function (name: string) {
  window.document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export async function getInitialState(): Promise<{
  currentUser?: API.CurrentUser;
  settings?: LayoutSettings;
}> {
  // Username/password login is handled by this frontend and leads to `token` being stored in localStorage.
  // Other frontend logic depends on the `token` localStorage value (sending API requests, etc.),
  // so it's crucial that it's there.
  //
  // The SSO flow cannot inject a `token` into localStorage, so it sets an `oidc_user_token` cookie instead.
  // Here, we assist the SSO flow by migrating the cookie's value to localStorage and getting rid of it.
  //
  // From that point onward, both authentication flows behave identically.

  const oidcCookie = getCookie(document.cookie, 'oidc_user_token');
  if (oidcCookie) {
    localStorage.setItem('token', oidcCookie);

    // We delete the cookie, so that logout (which only deals with localStorage)
    // would not redirect us here and have us immediately log the user in again.
    deleteCookie('oidc_user_token');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    const redirect = getUrlQuery('redirect') || '/';
    history.replace(`/user/login?redirect=${redirect}`);
  }

  const currentUser = await queryCurrent();
  return {
    currentUser,
    settings: defaultSettings,
  };
}

export const layout = ({ initialState }: { initialState: { settings?: LayoutSettings } }) => {
  return {
    headerRender: undefined,
    rightContentRender: () => <RightContent />,
    disableContentMargin: false,
    footerRender: () => <Footer />,
    menuHeaderRender: undefined,
    menuDataRender: getMenuData,
    ...initialState?.settings,
  };
};

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["obj"] }] */
const nullValueFilter = (obj: Record<string, any>) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (isPlainObject(value)) {
      nullValueFilter(value);
    } else if ([null, undefined].includes(value)) {
      delete obj[key];
    }
  });
};

export const request: RequestConfig = {
  prefix: '/apisix/admin',
  errorHandler,
  credentials: 'same-origin',
  requestInterceptors: [
    (url, options) => {
      const newOptions = { ...options };
      if (newOptions.data) {
        nullValueFilter(newOptions.data);
      }
      newOptions.headers = {
        ...options.headers,
        Authorization: localStorage.getItem('token') || '',
      };
      return {
        url,
        options: { ...newOptions, interceptors: true },
      };
    },
  ],
  responseInterceptors: [
    async (res) => {
      if (!res.ok) {
        // NOTE: http code >= 400, using errorHandler
        return res;
      }

      const data = await res.json();
      const { code = -1 } = data as Res<any>;
      if (code !== 0) {
        // eslint-disable-next-line
        return Promise.reject({ response: res, data });
      }
      return data;
    },
  ],
};
