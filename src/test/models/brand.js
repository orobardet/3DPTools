'use strict';

const helper = require('../helper.js');

const chaiAsPromised = require("chai-as-promised");
const chai = require('chai');
chai.use(chaiAsPromised);
const expect = chai.expect;
const should = chai.should();

const Brand = require('../../models/brand')();

describe('Brands', async function () {
    it('should connect to database', async function() {
        this.slow(1000);
        return Brand.find().exec();
    });
    describe('Add a brand', function () {
        it('should save the new brand', function () {
            let brand = new Brand({
                name: "Brand 1",
                url: "http://www.marque.fr"
            });
            return brand.save();
        });
        it('should retreive list of brands', function () {
            return Brand.find().sort('name').exec();
        });
        it('should be only 1 brand', async function () {
            let brands = await Brand.find().sort('name').exec();
            return expect(brands).to.have.lengthOf(1);
        });
        describe('Check created brand', function() {
            let brandIdx = 0;
            it('should retreive brand data', async function () {
                let brands = await Brand.find().sort('name').exec();
                return Brand.findById(brands[brandIdx]._id).exec();
            });
            it('name should be "Brand 1"', async function () {
                let brands = await Brand.find().sort('name').exec();
                let brand = await Brand.findById(brands[brandIdx]._id).exec();
                expect(brand).to.have.property('name').to.equals('Brand 1');
            });
            it('url should be "http://www.marque.fr"', async function () {
                let brands = await Brand.find().sort('name').exec();
                let brand = await Brand.findById(brands[brandIdx]._id).exec();
                expect(brand).to.have.property('url').to.equals('http://www.marque.fr');
            });
        });
    });
    describe('Add another brand', function () {
        it('should save the second new brand', function () {
            let brand = new Brand({
                name: "Brand 2",
                url: "http://www.brand.com"
            });
            return brand.save();
        });
        it('should retreive list of brands', function () {
            return Brand.find().sort('name').exec();
        });
        it('should be only 2 brands', async function () {
            let brands = await Brand.find().sort('name').exec();
            return expect(brands).to.have.lengthOf(2);
        });
        describe('Check created brand', function() {
            let brandIdx = 1;
            it('should retreive brand data', async function () {
                let brands = await Brand.find().sort('name').exec();
                return Brand.findById(brands[brandIdx]._id).exec();
            });
            it('name should be "Brand 2"', async function () {
                let brands = await Brand.find().sort('name').exec();
                let brand = await Brand.findById(brands[brandIdx]._id).exec();
                expect(brand).to.have.property('name').to.equals('Brand 2');
            });
            it('url should be "http://www.brand.com"', async function () {
                let brands = await Brand.find().sort('name').exec();
                let brand = await Brand.findById(brands[brandIdx]._id).exec();
                expect(brand).to.have.property('url').to.equals('http://www.brand.com');
            });
        });
    });
    describe('Edit brands', function() {
        let newName = "Brand 1 new";
        let newUrl = "https://newurl";
        it('should edit first brand name to "'+newName+'"', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[0];
            brand.name = newName;
            return brand.save();
        });
        it('first brand name should be "'+newName+'"', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[0];
            expect(brand).to.have.property('name').to.equals(newName);
        });
        it('should edit second brand url to "'+newUrl+'"', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[1];
            brand.url = newUrl;
            return brand.save();
        });
        it('second brand url should be "'+newUrl+'"', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[1];
            expect(brand).to.have.property('url').to.equals(newUrl);
        });
        it('should edit first brand name back to "Brand 1"', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[0];
            brand.name = "Brand 1";
            return brand.save();
        });
    });
    describe('Logo', function() {
        let picture = Buffer.from("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"
            , "base64");
        let brandLogo = {
            name: 'test.gif',
            mimeType: 'image/gif',
            size: picture.length,
            data: picture
        };
        it('should set logo to first brand', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[0];
            brand.logo = brandLogo;
            return brand.save();
        });
        it('should get logo from first brand', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[0];
            expect(brand).to.have.property('logo');
            expect(brand.logo).to.have.property('name').to.equals(brandLogo.name);
            expect(brand.logo).to.have.property('mimeType').to.equals(brandLogo.mimeType);
            expect(brand.logo).to.have.property('size').to.equals(brandLogo.size);
            expect(brand.logo).to.have.property('data');
            expect(brand.logo.data.compare(brandLogo.data));
        });
        it('should set logo to second brand', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[1];
            brand.logo = brandLogo;
            return brand.save();
        });
        it('should remove logo from first brand', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[0];
            brand.logo = undefined;
            return brand.save();
        });
        it('should not be any logo in first brand', async function() {
            let brands = await Brand.find().sort('name').exec();
            let brand = brands[0];
            expect(brand).to.have.property('logo');
            expect(brand.logo).to.have.property('name').to.be.undefined;
            expect(brand.logo).to.have.property('mimeType').to.be.undefined;
            expect(brand.logo).to.have.property('size').to.be.undefined;
            expect(brand.logo).to.have.property('data').to.be.undefined;
        });
    });
    describe('Random brand', function() {
        this.retries(5);
        this.slow(500);
        it('should get have at list 1 different brand out of 10 random brands', async function() {
            let brands = {};

            for (let i=0; i <= 10; i++) {
                let brand = await Brand.findOneRandom();
                brands[brand._id] = true;
            }

            expect(Object.keys(brands)).to.have.lengthOf.above(1);
        });
    });
    describe('Delete brands', function() {
        it('should delete the "Brand 1" brand', async function() {
            let brand = await Brand.findOne().exec();
            return Brand.findById(brand._id).remove().exec();
        });
        it('should be only 1 brand', async function () {
            let brands = await Brand.find().sort('name').exec();
            return expect(brands).to.have.lengthOf(1);
        });
        it('should delete the "Brand 2" brand', async function() {
            let brand = await Brand.findOne().exec();
            return Brand.findById(brand._id).remove().exec();
        });
        it('should not be any brands', async function () {
            let brands = await Brand.find().sort('name').exec();
            return expect(brands).to.have.lengthOf(0);
        });
    });
});
