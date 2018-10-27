define([
    'jquery',
    'Magento_Customer/js/zxcvbn',
    'mage/translate',
    'mage/validation',
    'Magento_Customer/js/password-strength-indicator',
    'SamJ_SecurePassword/js/sha1'
], function ($, zxcvbn, $t, $v, $psi, sha1) {

    $.widget('samj.passwordStrengthIndicator', $.mage.passwordStrengthIndicator, {

        /* Store our active xhttp request so we can abort it */
        _active_request: null,

        /* Add a grace period for hiding the notice on password change to try and prevent flickering */
        _leaked_notice_timeout: null,

        _calculateStrength: function() {
            this._checkPwnedCount();
            return this._super();
        },


        /**
         * @TODO: Abstract this function a ton!
         * @private
         */
        _checkPwnedCount: function() {
            var password = this._getPassword();
            var hash = this._sha1(password);

            /** @TODO: Move into a config property */
            var endpoint = 'https://api.pwnedpasswords.com/range/';
            var prefix = hash.substr(0, 5);
            var suffix = hash.substr(5);

            var url = endpoint + prefix;

            if(this._active_request !== null) {
                this._active_request.abort();
            }

            /** @TODO: Move into a config property */
            var leaked_notice = document.querySelector('#password-leaked-notice');
            if (leaked_notice !== null) {
                if(this._leaked_notice_timeout !== null)
                    clearTimeout(this._leaked_notice_timeout);


                /** @TODO: Move timeout length into a config property */
                this._leaked_notice_timeout = setTimeout(function(){
                    /** @TODO: Select a class rather than style */
                    leaked_notice.style.opacity = 0;
                }, 500);
            }

            this._active_request = jQuery.ajax({
                url: url,
                hash: hash,
                suffix: suffix,
                leaked_timeout: this._leaked_notice_timeout
            }).done( function(data){
                clearTimeout(this.leaked_timeout);

                /** @TODO: Move into an additional function */
                var regex = new RegExp(`^${this.suffix}:(\\d+)$`, 'gim');
                var res = regex.exec(data);
                var cnt = (res instanceof Array) ? res[1] : 0;
                console.log(hash+` | Pwned Count: ${cnt}`);

                /** @TODO: Move threshold into a config property */
                if(parseInt(cnt) > 25) {
                    /** @TODO: Move selector into a config property */
                    var leaked_notice = document.querySelector('#password-leaked-notice');
                    if (leaked_notice === null) {
                        var notice = document.createElement('div');

                        /** @TODO: Move selector into a config property */
                        notice.id = 'password-leaked-notice';

                        /** @TODO: Use a more extendable way for the string */
                        notice.innerHTML = `This password has been leaked over <span id="password-leaked-notice-count">${cnt}</span> times. Please consider a different password`;

                        /** @TODO: Move Styling into a class so extendability */
                        notice.setAttribute('style', 'opacity:0;background:#921010;color:#fff;padding: 5px 10px;margin: 5px 0 0 0;transition:.15s ease;');

                        /** @TODO: Abstract into additional function & Move selector into a class so extendability */
                        document.querySelector('[data-role=password-strength-meter]').after(notice);
                    } else {
                        /** @TODO: Select a class rather than style */
                        leaked_notice.style.opacity = 1;

                        /** @TODO: Move selector into a config property */
                        document.querySelector('#password-leaked-notice-count').innerText = cnt;
                    }
                } else {
                    /** @TODO: Move selector into a config property */
                    var leaked_notice = document.querySelector('#password-leaked-notice');
                    if (leaked_notice !== null) {
                        /** @TODO: Select a class rather than style */
                        leaked_notice.style.opacity = 0;
                    }
                }
            });
        },


        /**
         * Hash a string with SHA1
         *
         * @param string
         * @returns {string}
         * @private
         */
        _sha1: function(string) {
            return sha1.hex_sha1(string).toLowerCase();
        }

    });

    return $.samj.passwordStrengthIndicator;
});