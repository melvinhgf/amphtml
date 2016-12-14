/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AmpAdNetworkAdsenseImpl} from '../amp-ad-network-adsense-impl';
import {AmpAdUIHandler} from '../../../amp-ad/0.1/amp-ad-ui'; // eslint-disable-line no-unused-vars
import {
  AmpAdXOriginIframeHandler,    // eslint-disable-line no-unused-vars
} from '../../../amp-ad/0.1/amp-ad-xorigin-iframe-handler';
import {base64UrlDecodeToBytes} from '../../../../src/utils/base64';
import {utf8Encode} from '../../../../src/utils/bytes';
import * as sinon from 'sinon';

describe('amp-ad-network-adsense-impl', () => {

  let sandbox;
  let adsenseImpl;
  let adsenseImplElem;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    adsenseImplElem = document.createElement('amp-ad');
    adsenseImplElem.setAttribute('type', 'adsense');
    adsenseImplElem.setAttribute('data-ad-client', 'adsense');
    sandbox.stub(AmpAdNetworkAdsenseImpl.prototype, 'getSigningServiceNames',
        () => {
          return ['google'];
        });
    document.body.appendChild(adsenseImplElem);
    adsenseImpl = new AmpAdNetworkAdsenseImpl(adsenseImplElem);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#isValidElement', () => {
    it('should be valid', () => {
      expect(adsenseImpl.isValidElement()).to.be.true;
    });
    it('should NOT be valid (impl tag name)', () => {
      adsenseImplElem = document.createElement('amp-ad-network-adsense-impl');
      adsenseImplElem.setAttribute('type', 'adsense');
      adsenseImplElem.setAttribute('data-ad-client', 'adsense');
      adsenseImpl = new AmpAdNetworkAdsenseImpl(adsenseImplElem);
      expect(adsenseImpl.isValidElement()).to.be.false;
    });
    it.skip('should be NOT valid (missing ad client)', () => {
      // TODO(taymonbeal): reenable this test after clarifying validation
      adsenseImplElem.setAttribute('data-ad-client', '');
      adsenseImplElem.setAttribute('type', 'adsense');
      expect(adsenseImpl.isValidElement()).to.be.false;
    });
    it('should be valid (amp-embed)', () => {
      adsenseImplElem = document.createElement('amp-embed');
      adsenseImplElem.setAttribute('type', 'adsense');
      adsenseImplElem.setAttribute('data-ad-client', 'adsense');
      adsenseImpl = new AmpAdNetworkAdsenseImpl(adsenseImplElem);
      expect(adsenseImpl.isValidElement()).to.be.true;
    });
  });

  describe('#extractCreativeAndSignature', () => {
    it('without signature', () => {
      return utf8Encode('some creative').then(creative => {
        return expect(adsenseImpl.extractCreativeAndSignature(
          creative,
          {
            get: function() { return undefined; },
            has: function() { return false; },
          })).to.eventually.deep.equal(
                {creative, signature: null});
      });
    });
    it('with signature', () => {
      return utf8Encode('some creative').then(creative => {
        return expect(adsenseImpl.extractCreativeAndSignature(
          creative,
          {
            get: function(name) {
              return name == 'X-AmpAdSignature' ? 'AQAB' : undefined;
            },
            has: function(name) {
              return name === 'X-AmpAdSignature';
            },
          })).to.eventually.deep.equal(
              {creative, signature: base64UrlDecodeToBytes('AQAB')});
      });
    });
  });

  describe('#getAdUrl', () => {
    it('returns the right URL', () => {
      adsenseImpl.onLayoutMeasure();
      return adsenseImpl.getAdUrl().then(url => {
        expect(url).to.match(new RegExp(
          'https://googleads\\.g\\.doubleclick\\.net/pagead/ads' +
          '\\?client=adsense&format=0x0&w=0&h=0&adtest=false' +
          '&adk=4075575999&bc=1&vis=1&wgl=1' +
          '&is_amp=3&amp_v=%24internalRuntimeVersion%24' +
          // Depending on how the test is run, it can get different results.
          '&d_imp=1&dt=[0-9]+&ifi=[0-9]+&adf=1597394791' +
          '&c=[0-9]+&output=html&nhd=1&biw=[0-9]+&bih=[0-9]+' +
          '&adx=-10000&ady=-10000&u_aw=[0-9]+&u_ah=[0-9]+&u_cd=24' +
          '&u_w=[0-9]+&u_h=[0-9]+&u_tz=-?[0-9]+&u_his=[0-9]+' +
          '&brdim=[0-9]+(%2C[0-9]+){9}' +
          '&isw=[0-9]+&ish=[0-9]+&dtd=[0-9]+' +
          '&url=https?%3A%2F%2F[a-zA-Z0-9.:%]+' +
          '&top=https?%3A%2F%2Flocalhost%3A9876%2F%3Fid%3D[0-9]+' +
          '(&loc=https?%3A%2F%2[a-zA-Z0-9.:%]+)?' +
          '&ref=https?%3A%2F%2Flocalhost%3A9876%2F%3Fid%3D[0-9]+'));
      });
    });
  });
});
