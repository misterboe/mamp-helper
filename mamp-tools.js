#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const shell = require('shelljs');

// get php versions from mamp
const phpVersions = () => {
  // empty array to store php versions
  const phpVersions = [];
  // path to mamp php versions folder
  const phpVersionsPath = '/Applications/MAMP/bin/php/';
  // get all php versions
  fs.readdirSync(phpVersionsPath).forEach(file => {
    if (fs.statSync(path.join(phpVersionsPath, file)).isDirectory()) {
      phpVersions.push(file);
    }
  });
  // create a new array with objects with name and value
  const phpVersionsArray = phpVersions.map(version => {
    return {
      title: version, value: version,
    };
  });

  // return the array
  return phpVersionsArray;
};

// ask user for php version
const choosePhpVersion = async () => {
  // prompt user for php version
  const response = await prompts({
    type: 'select',
    name: 'phpversion',
    message: 'Choose a PHP version',
    choices: phpVersions(),
  });

  // return the selected php version
  return response.phpversion;
};

// build php path and return it
const phpPathBuilder = (phpVersion) => {
  return `/Applications/MAMP/bin/php/${phpVersion}/bin/php`;
};

// check if .php-version file exists
const checkPhpVersionFile = () => {
  // path to .php-version file
  const phpVersionFilePath = path.join(process.cwd(), '.php-version');
  // check if .php-version file exists
  if (fs.existsSync(phpVersionFilePath)) {
    // read the file and return the content
    const phpVersion = fs.readFileSync(phpVersionFilePath, 'utf8');
    // return the php version without the new line  character
    return phpVersion.replace(/\n/g, '');
  }
  // return false
  return false;
};

const linkPhpVersion = (phpVersion) => {
  if (phpVersion) {
    console.log('\n' + `PHP Version: ${phpVersion.replace('php', '')}`);
    //log the php path
    console.log('PHP Version Path: ', phpPathBuilder(phpVersion));
    // create symlink to php version in mamp bin folder
    shell.exec(`ln -sf ${phpPathBuilder(phpVersion)} $HOME/bin/php`);
    // create symlink to composer version in mamp bin folder
    shell.exec(`ln -sf /Applications/MAMP/bin/php/composer $HOME/bin/composer`);
    // create symlink to mysql version in mamp bin folder
    shell.exec(`ln -sf /Applications/MAMP/Library/bin/mysql $HOME/bin/mysql`);
    // create symlink to mysqldump version in mamp bin folder
    shell.exec(`ln -sf /Applications/MAMP/Library/bin/mysqldump $HOME/bin/mysqldump`);
    // shell.exec(`php -v`);
    shell.exec(`${phpPathBuilder(phpVersion)} -v`);

    //return php version
    return phpVersion;
  }
};

const askToCreatePhpVersionFile = async () => {
  // prompt user to create .php-version file
  const response = await prompts({
    type: 'confirm',
    name: 'createPhpVersionFile',
    message: 'Do you want to create a .php-version file?',
  });

  // return the response
  return response.createPhpVersionFile;
};

const writePhpVersionFile = (phpVersion) => {
  // path to .php-version file
  const phpVersionFilePath = path.join(process.cwd(), '.php-version');
  // check if .php-version file exists
  if (!fs.existsSync(phpVersionFilePath)) {
    // create .php-version file
    fs.writeFileSync(phpVersionFilePath, phpVersion);
  }
};

// run php version selector and return the selected version
const run = async () => {
  // check if .php-version file exists
  const phpVersionFile = checkPhpVersionFile();
  // if .php-version file exists
  if (phpVersionFile) {
    // return the php version
    return linkPhpVersion(phpVersionFile);
  } else {
    // ask user for php version
    const phpVersion = await choosePhpVersion();
    // return the php version
    return linkPhpVersion(phpVersion);
  }
};

const gooBye = () => {
  console.log('\n' + 'Thanks for using PHP Version Selector!' + '\n');
};

run().then(phpVersion => {

  // if .php-version file does not exist
  if (!checkPhpVersionFile()) {
    // ask user if they want to create a .php-version file
    askToCreatePhpVersionFile().then(createPhpVersionFile => {
      // if user wants to create a .php-version file
      if (createPhpVersionFile) {
        // create .php-version file
        writePhpVersionFile(phpVersion);
        gooBye();
      } else {
        gooBye();
      }
    });
  } else {
    gooBye();
  }

});
