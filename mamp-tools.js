#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const shell = require('shelljs')
const { matchSorter } = require('match-sorter')

// get php versions from mamp
const phpVersions = () => {
    // empty array to store php versions
    const phpVersions = []
    // path to mamp php versions folder
    const phpVersionsPath = '/Applications/MAMP/bin/php/'
    // get all php versions
    fs.readdirSync(phpVersionsPath).forEach((file) => {
        if (fs.statSync(path.join(phpVersionsPath, file)).isDirectory()) {
            // remove the 'php' from the version
            phpVersions.push(file)
        }
    })
    // return the array
    return phpVersions
}

// ask user for php version
const choosePhpVersion = async () => {
    // map php versions to an array of objects
    const phpVersionsArray = phpVersions().map((version) => {
        return {
            title: version,
            value: version,
        }
    })
    // prompt user for php version
    const response = await prompts({
        type: 'select',
        name: 'phpversion',
        message: 'Choose a PHP version',
        choices: phpVersionsArray,
    })

    // return the selected php version
    return response.phpversion
}

// build php path and return it
const phpPathBuilder = (phpVersion) => {
    return `/Applications/MAMP/bin/php/${phpVersion}/bin/php`
}

// check if .php-version file exists
const checkPhpVersionFile = () => {
    // path to .php-version file
    const phpVersionFilePath = path.join(process.cwd(), '.php-version')
    // check if .php-version file exists
    if (fs.existsSync(phpVersionFilePath)) {
        // read the file and return the content
        const phpVersion = fs.readFileSync(phpVersionFilePath, 'utf8')
        // return the php version without the new line  character
        return phpVersion.replace(/\n/g, '')
    }
    // return false
    return false
}

const linkPhpVersion = (phpVersion) => {
    // check if php version exists in mamp
    console.log('\n' + 'Checking if PHP version exists in mamp...')
    let availablePhpVersions = phpVersions()
    if (availablePhpVersions.includes(phpVersion)) {
        console.log('PHP version exists in mamp...')
    } else {
        availablePhpVersions = availablePhpVersions.map((version) => {
            // remove the 'php' from string
            return version.replace('php', '')
        })
        // remove sting php to compare versions
        const searchedPhpVersion = phpVersion.replace('php', '')
        //  cut the string after 4 characters to find the closest version
        const searchedPhpVersionCut = searchedPhpVersion.slice(0, 4)
        // find the closest version
        const bestMatch = matchSorter(availablePhpVersions, searchedPhpVersionCut)[0]
        if (bestMatch) {
            console.log(`No matching PHP version for ${searchedPhpVersion} found.`)
            console.log('Linking best matching PHP version now... ' + bestMatch)
            phpVersion = 'php' + bestMatch
        } else {
            console.log(`No matching PHP version for ${searchedPhpVersion} found.`)
            console.log('Please update your .php-version file, or install the php version in mamp...' + '\n')
            process.exit()
        }
    }
    if (phpVersion) {
        console.log('\n' + `PHP Version: ${phpVersion.replace('php', '')}`)
        //log the php path
        console.log('PHP Version Path: ', phpPathBuilder(phpVersion))
        // create symlink to php version in mamp bin folder
        shell.exec(`ln -sf ${phpPathBuilder(phpVersion)} $HOME/bin/php`)
        // create symlink to composer version in mamp bin folder
        shell.exec(`ln -sf /Applications/MAMP/bin/php/composer $HOME/bin/composer`)
        // create symlink to mysql version in mamp bin folder
        shell.exec(`ln -sf /Applications/MAMP/Library/bin/mysql $HOME/bin/mysql`)
        // create symlink to mysqldump version in mamp bin folder
        shell.exec(`ln -sf /Applications/MAMP/Library/bin/mysqldump $HOME/bin/mysqldump`)
        // shell.exec(`php -v`);
        shell.exec(`${phpPathBuilder(phpVersion)} -v`)

        //return php version
        return phpVersion
    }
}

const askToCreatePhpVersionFile = async () => {
    // prompt user to create .php-version file
    const response = await prompts({
        type: 'confirm',
        name: 'createPhpVersionFile',
        message: 'Do you want to create a .php-version file?',
    })

    // return the response
    return response.createPhpVersionFile
}

const writePhpVersionFile = (phpVersion) => {
    // path to .php-version file
    const phpVersionFilePath = path.join(process.cwd(), '.php-version')
    // check if .php-version file exists
    if (!fs.existsSync(phpVersionFilePath)) {
        // create .php-version file
        fs.writeFileSync(phpVersionFilePath, phpVersion)
    }
}

// read php version from composer.json
const readPhpVersionFromComposerJson = () => {
    // path to composer.json
    const composerJsonPath = path.join(process.cwd(), 'composer.json')
    // check if composer.json exists
    if (fs.existsSync(composerJsonPath)) {
        // read composer.json
        const composerJson = JSON.parse(fs.readFileSync(composerJsonPath))
        // return the php version
        if (composerJson.config?.platform?.php) {
            return composerJson.config?.platform?.php
        } else {
            return false
        }
    }
}

const checkNodeVersion = () => {
    // check if node version is correct
    const nodeVersion = shell.exec('node -v', { silent: true }).stdout
    // check if node version is correct
    return !!nodeVersion.includes('v16')
}

// run php version selector and return the selected version
const run = async () => {
    // check if phpversion is set in composer.json
    const composerPHPVersion = readPhpVersionFromComposerJson()
    // check if .php-version file exists
    const phpVersionFile = checkPhpVersionFile()

    if (composerPHPVersion) {
        console.log('\n' + `Using PHP Version from composer.json: ${composerPHPVersion}`)
        // return the php version from composer.json
        return linkPhpVersion(composerPHPVersion)
    } else if (phpVersionFile) {
        console.log('\n' + `Using PHP Version from .php-version file: ${phpVersionFile}`)
        // return the php version from .php-version file
        return linkPhpVersion(phpVersionFile)
    } else {
        // ask user for php version
        const phpVersion = await choosePhpVersion()
        // return the php version
        return linkPhpVersion(phpVersion)
    }
}

const gooBye = () => {
    console.log('\n' + 'Thanks for using PHP Version Selector!' + '\n')
}

if (checkNodeVersion()) {
    run().then((phpVersion) => {
        // if .php-version file does not exist
        if (!checkPhpVersionFile() && !readPhpVersionFromComposerJson()) {
            // ask user if they want to create a .php-version file
            askToCreatePhpVersionFile().then((createPhpVersionFile) => {
                // if user wants to create a .php-version file
                if (createPhpVersionFile) {
                    // create .php-version file
                    writePhpVersionFile(phpVersion)
                    gooBye()
                } else {
                    gooBye()
                }
            })
        } else {
            gooBye()
        }
    })
} else {
    console.log('\n' + 'Please use NodeJS v16.x' + '\n')
}
