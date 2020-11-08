(function () {
    document.addEventListener("DOMContentLoaded", function (event) {
        'use strict';

        var encodedUrl = encodeURIComponent(window.location.href);
        var htmlData = document.getElementsByTagName('html')[0]; //html элемент в который трекер пишет данные
        var clientData = '';
        var createdUrl = '';
        var referer;
        var scriptJSONP; //переменная с асин. скриптом
        var offerId = htmlData.getAttribute('data-offer_id');
        var pageType = htmlData.getAttribute('data-page_type');

        //объект с известными параметрами или куками
        var pageData = {
            utm_source: isExist('utm_source'),
            utm_medium: isExist('utm_medium'),
            utm_campaign: isExist('utm_campaign'),
            utm_content: isExist('utm_content'),
            utm_term: isExist('utm_term'),
            cbwv: isExist('cbwv'),
            fb_sot: isExist('fb_sot'), //флаг для установки пикселя на прелендинг
            fb_sol: isExist('fb_sol'), //флаг для установки пикселя на лендинг
            fb_sos: isExist('fb_sos'), //флаг для установки пикселя на success
        };


        //если это не лендинг
        if (pageType !== 'landing') {
            referer = document.referrer;
            var prelandId = htmlData.getAttribute('data-prelanding_id');
            var params = 'url=' + encodedUrl +
                createParam('&utm_source=', pageData.utm_source) +
                createParam('&utm_medium=', pageData.utm_medium) +
                createParam('&utm_campaign=', pageData.utm_campaign) +
                createParam('&utm_content=', pageData.utm_content) +
                createParam('&utm_term=', pageData.utm_term) +
                createParam('&referer=', rightRef()) +
                createParam('&prelanding_id=', prelandId) +
                createParam('&offer_id=', offerId) +
                createParam('&page_type=', pageType);

            //вызываем трекер и передаем в него известные параметры
            jsonp('//webvkrd.com/js.php?' + params, function (data) {
            });

            //после получения лендинга из трекера, меняем ссылки на транзитке
            scriptJSONP.addEventListener('load', function () {
                var trackerData = {
                    land: isReal(htmlData.getAttribute('data-landing_url')),
                    guid: isReal(getGuid('guid')),
                    fguid: isReal(getGuid('first_guid')),
                };

                createdUrl = trackerData.land + '?';
                for (var key in pageData) {
                    if (isReal(pageData[key])) {
                        createdUrl += key + '=' + pageData[key] + '&';
                    }
                }

                createdUrl += createParam('referer=', findRef()) +
                    createParam('&prelanding_id=', prelandId);
                if (document.body.getAttribute('data-links')) {
                    if (document.body.getAttribute('data-links') === 'change-only-wv') {
                        changeFullLinksByClassName('.wv_link');
                    }
                } else {
                    changeLinks();
                }
                setGuidsToCookie();
            });

            var params = 'url=' + encodedUrl +
                createParam('&utm_source=', pageData.utm_source) +
                createParam('&utm_medium=', pageData.utm_medium) +
                createParam('&utm_campaign=', pageData.utm_campaign) +
                createParam('&utm_content=', pageData.utm_content) +
                createParam('&utm_term=', pageData.utm_term) +
                createParam('&referer=', rightRef()) +
                createParam('&landing_id=', landId) +
                createParam('&offer_id=', offerId) +
                createParam('&page_type=', pageType);
            //запрашиваем трекер с передачей параметров
            jsonp('//webvkrd.com/js.php?' + params, function (data) {
            });


            //нет потока, значит из закладок
            if (getParam('utm_source') == null) {
                //ставим реферер из кук
                setAllHiddenInputs('referer', isReal(getCookie('c_referer')));
                setParamsToInput();
            } else { //если есть поток, то данные проставляем из параметров
                scriptJSONP.addEventListener('load', function () {
                    setGuidsToCookie();
                    setGuidsToInput();
                });
                if (getParam('referer') == null) {
                    referer = document.referrer;
                    setAllHiddenInputs('referer', referer);
                    setCookie('c_referer', referer, 30);
                } else {
                    setAllHiddenInputs('referer', getParam('referer'));
                    setCookie('c_referer', getParam('referer'), 30);
                }
                setParamsToCookie();
                setParamsToInput();
            }
            setPlaceholders();

            //меняем ссылки у ссылок оплаты если есть
            changeLinksByClassName('.wv_formpay');
        }

        //подключение модулей через параметры

        var wvModules = {
            mod: [
                {
                    param: 'testwv',
                    path: '//webvork.com/js/modules/testlanding/wvtests.js',
                },
                {
                    param: 'cbwv',
                    path: '//webvork.com/js/modules/comebacker/comeback.js',
                },
                {
                    param: 'fpwv',
                    path: '//webvork.com/js/modules/fakepay/fakepay.js',
                },
                {
                    path: '//webvork.com/js/modules/phonemask/wvmask.js',
                },
                // {
                //     path: '//webvork.com/js/modules/validation/wvvalid.js',
                // },
            ],

            //запуск модулей
            init: function () {
                this.mod.forEach(function (mod) {
                    //включаем модуль если есть кука или параметр
                    if (mod.param) {
                        if (isExist(mod.param)) {
                            wvModules.appendModule(mod.path);
                        }
                        //включаем модуль везде, если не указан способ включения
                    } else {
                        wvModules.appendModule(mod.path);
                    }
                })
            },

            //добавление модуля в дом
            appendModule: function (modulePath) {
                var module = document.createElement('script');
                module.type = 'text/javascript';
                module.src = modulePath;
                document.body.appendChild(module);
            },
        };
        wvModules.init();


        // изменение ссылок на странице на новый путь
        function changeLinks() {
            var amountLinks = document.getElementsByTagName('a').length;
            for (var i = 0; i < amountLinks; i++) {
                var link = document.getElementsByTagName('a')[i];
                link.setAttribute('href', createdUrl);
            }
        }

        // изменение ПАРАМЕТРОВ ссылок на странице только с определенным классом
        function changeLinksByClassName(className) {
            var links = document.querySelectorAll(className);
            links.forEach(function (link) {
                var currentHref = link.getAttribute('href');
                currentHref = currentHref + '?';
                link.setAttribute('href', currentHref + decodeURIComponent(params));
            })
        }

        // изменение ПОЛНЫХ ссылок на странице только с определенным классом
        function changeFullLinksByClassName(className) {
            var links = document.querySelectorAll(className);
            links.forEach(function (link) {
                link.setAttribute('href', createdUrl);
            });
        }

        //получение гуида
        function getGuid(name) {
            var dataGuid = htmlData.getAttribute('data-' + name);
            if (dataGuid !== null && dataGuid !== undefined) {
                return dataGuid;
            } else {
                var c_guid = getCookie('c_' + name);
                if (c_guid !== null && c_guid !== undefined) {
                    return c_guid;
                } else {
                    return '';
                }
            }
        }


        //ставим гуиды в инпуты
        function setGuidsToInput() {
            var first_guid = htmlData.getAttribute('data-first_guid');
            var guid = htmlData.getAttribute('data-guid');
            if (first_guid !== null && first_guid !== undefined && first_guid !== '') {
                setAllHiddenInputs('first_guid', first_guid);
                setAllHiddenInputs('guid', guid);
            } else {
                setAllHiddenInputs('first_guid', guid);
                setAllHiddenInputs('guid', guid);
            }
        }

        //set placeholders
        function setPlaceholders(option) {
            var selects = document.querySelectorAll('.country_select'); //получаем все селекты
            var phones = document.getElementsByName('phone'); //получаем все инпуты с телефоном
            var optionVal = '';

            //выставляем дефолтное значение плейсхолдеров
            window.onload = function () {
                var defaultSelect = selects[0];
                if (defaultSelect) {
                    optionVal = defaultSelect.value; //получаем текущее значение селекта
                    changePhonePlaceholder(optionVal);
                }
            };

            //объект со всеми плейсхолдерами
            var phonesHolders = {
                at: 'mob:+43 644 123456',
                ch: 'mob:+268 76123456',
                de: 'mob:+49 151 23456789',
                it: 'mob:+39 312 3456789',
                es: 'mob:+34 612 345678',
                lv: 'mob:+371 21 234567',
                lt: 'mob:+370 612 34567',
                ee: 'mob:+372 51234567',
                ro: 'mob:+40 712 345678',
                bg: 'mob:+359 48 123456',
                pl: 'mob:+48 512 345678',
                gr: 'mob:+30 691 2345678',
                cy: 'mob:+357 96 123456',
                hu: 'mob:+36 20 1234567',
                fr: 'mob:+33 6 12 345678',
                cz: 'mob:+420 601 123456',
                pt: 'mob:+351 293 402 881',
                ru: 'моб:+7 999 99 9999',
            };

            selects.forEach(function (select) { //для каждого селекта вешаем обработчик
                select.addEventListener("change", function () {
                    optionVal = this.options[this.selectedIndex].value; //получаем текущее значение селекта
                    changePhonePlaceholder(optionVal);//меняем все инпуты phone

                    selects.forEach(function (otherSelect) {
                        var choose = otherSelect.value = optionVal;
                    });
                });
            });

            //функция смены всех инпутов с именем name
            function changePhonePlaceholder(optionVal) {
                phones.forEach(function (phone) {
                    phone.placeholder = phonesHolders[optionVal.toLowerCase()];
                });
            }
        }

        function setAllHiddenInputs(inputName, value) {
            var inputs = document.querySelectorAll('input[name="' + inputName + '"]');

            inputs.forEach(function (input) {
                input.value = value;
            });
        }

        //проверка на существование параметра или куки, возвращает первое что существует или пустую строку
        function isExist(prop) {
            if (getParam(prop) !== null && getParam(prop) !== undefined) {
                return (getParam(prop));
            } else {
                if (getCookie('c_' + prop) !== null && getCookie('c_' + prop) !== undefined) {
                    return getCookie('c_' + prop);
                } else {
                    return '';
                }
            }
        }

        //проверка существования свойства
        function isReal(prop) {
            if (prop !== undefined && prop !== null) {
                return prop;
            }
            return '';
        }


        //поиск реферера. возвращает либо текущий либо из куки
        function findRef() {
            if (referer !== '' && referer !== null && referer !== undefined) {
                return referer;
            }
            if (getCookie('c_referer') !== undefined) {
                return getCookie('c_referer');
            }
            return '';
        }

        //для определения реферера на странице success/транзитке
        function rightRef() {
            if (pageType === 'success') {
                return encodeURIComponent(isReal(getCookie('c_referer')));
            } else {
                return encodeURIComponent(findRef());
            }
        }

        //складывает строки, если второй параметр пустой или с ошибкой, вернет ''
        function createParam(str, existStr) {
            if (existStr !== undefined && existStr !== null && existStr !== '') {
                return str + existStr;
            }
            return '';
        }

        //функция асинхронного вызова
        function jsonp(url, callback) {
            var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            window[callbackName] = function (data) {
                delete window[callbackName];
                document.body.removeChild(scriptJSONP);
                callback(data);
            };
            scriptJSONP = document.createElement('script');
            scriptJSONP.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
            scriptJSONP.async = false;
            document.body.appendChild(scriptJSONP);
        }

        //функция для работы с url
        function getParam(name) {
            if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search)) ;
            return (name === null) ? null : decodeURIComponent(name[1]);
        }
    });
})();