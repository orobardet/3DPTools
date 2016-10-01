var expect = require('chai').expect;
var Brand = require('../../models/brand')();

describe('Brand', function () {
    describe('new', function () {
        var brand;
        it('new brand', function () {
            brand = new Brand({
                name: "Marque",
                url: "http://www.marque.com"
            });

            brand.save();
        });
        describe('name', function () {
            it('should be a string', function () {
                expect(brand.name).to.be.a('string');
            });
            it('should be "Marque"', function () {
                expect(brand.name).to.equals('Marque');
            });
        });
    });
});