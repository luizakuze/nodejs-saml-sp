PassportJS SAML authentication example
======================================

Description
-----------

An example to demonstrate the use of the Auth0's [passport-wsfed-saml2](https://github.com/auth0/passport-wsfed-saml2) authentication strategy for PassportJS with configuration loaded from metadata by [passport-saml-metadata](https://github.com/compwright/passport-saml-metadata).

Tested with Active Directory Federation Services (ADFS).

Configuration
-------------

This project supports .env files for setting up the environment. See [`.env-sample`](.env-sample) for a template.

If you are authenticating with ADFS, you will need to configure a relying party trust within ADFS for this project. This project will generate a metadata file at https://host:port/FederationMetadata/2007-06/FederationMetadata.xml. If the project is accessible from the ADFS server, it should import the metadata seamlessly by entering the URL (https://host:port) into the relying party trust setup wizard.

Usage
-----

```bash
$ npm install
$ npm start
```

Debugging
---------

Set the `DEBUG` environment variable:

```bash
$ DEBUG=* npm start
```

Authors
-------

| [!["Jonathon Hill"](http://gravatar.com/avatar/0954b07694d217460222ae1dc5fa9c40.png?s=60)](http://jonathonhill.net "Jonathon Hill <jhill9693@gmail.com>") | [!["Gerard Braad"](http://gravatar.com/avatar/e466994eea3c2a1672564e45aca844d0.png?s=60)](http://gbraad.nl "Gerard Braad <me@gbraad.nl>") |
|---|---|
| [@compwright](https://twitter.com/compwright) | [@gbraad](https://twitter.com/gbraad) |

License
-------

Licensed under the MIT license

Note
----

Based on [PassportJS-Authentication](https://github.com/DanialK/PassportJS-Authentication) by [Danial Khosravi](http://danialk.github.io/)
