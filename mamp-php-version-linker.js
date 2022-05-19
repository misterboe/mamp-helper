#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const shell = require('shelljs')

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

// build php path and return it
const phpPathBuilder = (phpVersion) => {
    return `/Applications/MAMP/bin/php/${phpVersion}/bin/php`
}

const askToLinkAllPhpVersion = async () => {
    // prompt user to create .php-version file
    const response = await prompts({
        type: 'confirm',
        name: 'createSymlinks',
        message: 'Do you want to create symlinks for all php versions?',
    })

    // return the response
    return response.createSymlinks
}

const askToLinkImageMagick = async () => {
    // prompt user to create .php-version file
    const response = await prompts({
        type: 'confirm',
        name: 'createSymlinksImageMagick',
        message: 'Do you want to create symlinks for ImageMagick?',
    })

    // return the response
    return response.createSymlinksImageMagick
}

const askToLinkOthers = async () => {
    // prompt user to create .php-version file
    const response = await prompts({
        type: 'confirm',
        name: 'createSymlinksOthers',
        message: 'Do you want to link other programs like composer?',
    })

    // return the response
    return response.createSymlinksOthers
}

const run = async () => {
    // ask user if they want to create symlinks
    const createSymlinks = await askToLinkAllPhpVersion()

    // if user wants to create symlinks
    if (createSymlinks) {
        // get all php versions
        const phpVers = phpVersions().map((version) => {
            // remove the 'php' from string
            return version.replace('php', '')
        })

        // loop through all php versions
        for (const phpVersion of phpVers) {
            // create symlink
            shell.exec(
                `ln -sf ${phpPathBuilder('php' + phpVersion)} $HOME/bin/php${phpVersion.slice(0, 3).replace('.', '')}`
            )
        }
    }

    const createSymlinksImageMagick = await askToLinkImageMagick()

    if (createSymlinksImageMagick) {
        shell.exec(`ln -sf /Applications/MAMP/Library/bin/convert /usr/local/bin/convert`)
        shell.exec(`ln -sf /Applications/MAMP/Library/bin/identify /usr/local/bin/identify`)
        shell.exec(`ln -sf /Applications/MAMP/Library/bin/composite /usr/local/bin/composite`)
    }

    const createSymlinksOthers = await askToLinkOthers()

    if (createSymlinksOthers) {
        shell.exec(`ln -sf /Applications/MAMP/bin/php/composer $HOME/bin/composer`)
    }
}

run()
