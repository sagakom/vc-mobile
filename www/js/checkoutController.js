angular.module('virtoshopApp')
// Checkout address step
.controller('checkoutAddressController', ['$scope', '$state', 'cartAPI', 'workContext', function ($scope, $state, cartAPI, workContext) {
    $scope.checkout = workContext.current.checkout = {};

    $scope.setCountry = function (addressType, countryName) {
        var country = _.findWhere($scope.checkout.countries, { name: countryName });
        if (country) {
            if (addressType == 'Shipping') {
                $scope.checkout.shippingAddress.countryCode = country.code3;
                $scope.checkout.shippingAddress.regionId = null;
                $scope.checkout.shippingAddress.regionName = null;
            }
            if (addressType == 'Billing') {
                $scope.checkout.billingAddress.countryCode = country.code3;
                $scope.checkout.billingAddress.regionId = null;
                $scope.checkout.billingAddress.regionName = null;
            }
            getRegions(country.code3);
        }
    }

    $scope.setCountryRegion = function (addressType, countryRegionName) {
        var countryRegion = _.find($scope.checkout.countryRegions, function (c) { return c.Name == countryRegionName; });
        if (countryRegion) {
            if (addressType == 'Shipping') {
                $scope.checkout.shippingAddress.RegionId = countryRegion.Code;
            }
            if (addressType == 'Billing') {
                $scope.checkout.billingAddress.RegionId = countryRegion.Code;
            }
        }
    }

    $scope.selectAddress = function (addressType) {
    }

    $scope.submitStep = function () {
        $scope.checkout.customerInformationProcessing = true;
        cartAPI.addAddress($scope.checkout.shippingAddress, function () {
            refreshCheckout();
            $state.go('checkout_shipping');
        });
    }

    function initialize() {
        $scope.checkout.orderSummaryExpanded = false;
        $scope.checkout.billingAddressEqualsShipping = true;
        $scope.checkout.shippingAddress = { type: 'Shipping' };
        $scope.checkout.billingAddress = { type: 'Billing' };
        $scope.checkout.bankCardInfo = {};
        $scope.checkout.selectedAddressId = 1;
        // getCurrentCustomer();
        getCountries();
        refreshCheckout();
    }

    function refreshCheckout() {
        $scope.checkout.couponProcessing = false;
        $scope.checkout.customerInformationProcessing = false;
        $scope.checkout.shippingMethodProcessing = false;
        cartAPI.getCart(function (cart) {
            $scope.checkout.id = cart.id;
            $scope.checkout.lineItems = cart.items;
            $scope.checkout.coupon = cart.coupon;
            $scope.checkout.subtotal = cart.subTotal;
            $scope.checkout.shippingTotal = cart.shippingTotal;
            $scope.checkout.taxTotal = cart.taxTotal;
            $scope.checkout.discountTotal = cart.discountTotal;
            $scope.checkout.total = cart.total;
            $scope.checkout.hasPhysicalProducts = cart.hasPhysicalProducts;
            if ($scope.checkout.hasPhysicalProducts) {
                getShippingAddress(cart.defaultShippingAddress);
            }
            if (!$scope.checkout.hasPhysicalProducts) {
                $state.go('checkout_payment');
            }
            getBillingAddress(cart.defaultBillingAddress);
            $scope.checkout.hasCustomerInformation = checkAddress($scope.checkout.shippingAddress, _.any($scope.checkout.countryRegions));
            $scope.checkout.hasShippingMethod = _.any(cart.shipments);
        });
    }

    function getCountries() {
        $scope.checkout.countries = cartAPI.getCountries();
    }

    function getRegions(countryCode3) {
        var country = _.findWhere($scope.checkout.countries, { code3: countryCode3 });
        $scope.checkout.countryRegions = country ? country.regions : null;
    }

    function getShippingAddress(cartAddress) {
        //$scope.checkout.shippingAddress.email = $scope.checkout.shippingAddress.email || $scope.customer.email || cartAddress.email;
        $scope.checkout.shippingAddress.email = $scope.checkout.shippingAddress.email || cartAddress.email;
        $scope.checkout.shippingAddress.firstName = $scope.checkout.shippingAddress.firstName || cartAddress.firstName;
        $scope.checkout.shippingAddress.lastName = $scope.checkout.shippingAddress.lastName || cartAddress.lastName;
        $scope.checkout.shippingAddress.organization = $scope.checkout.shippingAddress.organization || cartAddress.organization;
        $scope.checkout.shippingAddress.line1 = $scope.checkout.shippingAddress.line1 || cartAddress.line1;
        $scope.checkout.shippingAddress.line2 = $scope.checkout.shippingAddress.line2 || cartAddress.line2;
        $scope.checkout.shippingAddress.city = $scope.checkout.shippingAddress.city || cartAddress.city;
        $scope.checkout.shippingAddress.countryCode = $scope.checkout.shippingAddress.countryCode || cartAddress.countryCode;
        $scope.checkout.shippingAddress.countryName = $scope.checkout.shippingAddress.countryName || cartAddress.countryName;
        $scope.checkout.shippingAddress.regionId = $scope.checkout.shippingAddress.regionId || cartAddress.regionId;
        $scope.checkout.shippingAddress.regionName = $scope.checkout.shippingAddress.regionName || cartAddress.regionName;
        $scope.checkout.shippingAddress.postalCode = $scope.checkout.shippingAddress.postalCode || cartAddress.postalCode;
        $scope.checkout.shippingAddress.phone = $scope.checkout.shippingAddress.phone || cartAddress.phone;
        if ($scope.checkout.shippingAddress.countryCode) {
            getRegions($scope.checkout.shippingAddress.countryCode);
        }
        // selectAddress('Shipping');
    }

    function getBillingAddress(cartAddress) {
        angular.copy(cartAddress, $scope.checkout.billingAddress);
        $scope.checkout.billingAddress.type = 'Billing';
        $scope.checkout.billingAddressEqualsShipping = true;
    }

    function checkAddress(address, provinceRequired) {
        var isValid = false;
        if (address.email && address.firstName && address.lastName && address.line1 &&
            address.city && address.countryCode && address.countryName && address.postalCode) {
            if (!provinceRequired || provinceRequired && address.regionId && address.regionName) {
                isValid = true;
            }
        }
        return isValid;
    }

    initialize();
}])

    // Checkout Shipping step
.controller('checkoutShippingController', ['$scope', '$state', 'cartAPI', 'workContext', function ($scope, $state, cartAPI, workContext) {
    $scope.checkout = workContext.current.checkout;

    $scope.submitStep = function () {
        $scope.checkout.shippingMethodProcessing = true;
        cartAPI.setShippingMethod({ shippingMethodCode: $scope.checkout.shipmentMethodCode }, null, function () {
            refreshCheckout();
            $state.go('checkout_payment');
        });
    };
    
    function initialize() {
        getAvailableShippingMethods();
        refreshCheckout();
    }

    function getAvailableShippingMethods() {
        cartAPI.getAvailableShippingMethods(function (availableShippingMethods) {
            $scope.checkout.availableShippingMethods = availableShippingMethods;
            if (availableShippingMethods.length == 1) {
                $scope.checkout.shipmentMethodCode = availableShippingMethods[0].shipmentMethodCode;
            }
        });
    }

    function refreshCheckout() {
        $scope.checkout.shippingMethodProcessing = false;
        cartAPI.getCart(function (cart) {
            $scope.checkout.subtotal = cart.subTotal;
            $scope.checkout.shippingTotal = cart.shippingTotal;
            $scope.checkout.taxTotal = cart.taxTotal;
            $scope.checkout.discountTotal = cart.discountTotal;
            $scope.checkout.total = cart.total;
            $scope.checkout.hasShippingMethod = _.any(cart.shipments);
        });
    }

    initialize();
}])

    // Checkout Payment step
.controller('checkoutPaymentController', ['$scope', '$ionicHistory', function ($scope, $ionicHistory) {
    // hide back button in next view
    $ionicHistory.nextViewOptions({
        disableBack: true
    });
}]);