<p align="center">
<img src="https://user-images.githubusercontent.com/34238240/86224948-2bfaa300-bba7-11ea-9ceb-41f80a4c3744.png" alt="gitnLogo">
</p>

> a super simple cross-platform command line note taking application that makes life much more easier

## What exactly is `gitn` ?
- If you work on **CLI** a lot and don't want to waste your time managing your notes from anywhere but the **command line**
- `gitn` follows the same commands as `git` and so there is nothing new to know or learn. Just install and use.

## Installation and Usage
```
>>> npm install -g gitn 

>>> gitn config -g '/absolute/path/to/your/notes/directory/where-gitn-will-save-notes'

>>> gitn --help  // to know all the commands that gitn offers 

```

## What you mean exactly by `similar to git`  ?

- Firstly dont confuse gitn for some **Version Control System** . It follows same commands as git and is a powerful notes manager for folks who :heart: **CLI** but apart from it , it is not related to vcs.
- This illustration will make it much more clear on how commands for `gitn` are similar to `git` and what it means when you create a branch/commit in **gitn**

![GIT GITN equivalence](https://user-images.githubusercontent.com/34238240/86394990-1d061480-bcbd-11ea-9447-ec743834bf5d.png)

###  Now, have a look at the **gitn**  commands ( same as git isn't it ?)

![cmdline](https://user-images.githubusercontent.com/34238240/86395175-71a98f80-bcbd-11ea-8e60-5f8b89079499.png)


## Simple Internals
- gitn maintains a root directory (which you specify using `gitn config -g <absolute-path-to-root-directory>`) for your notes and maintains text files for your branches in this root directory.
- This makes it easy to access the notes through any text editor in case you need to.
- In case you don't feel like using gitn anymore, just uninstall it. Your notes are always there.
- Have a look at it in this pic (root directory with `.txt` files  )
![notes-folder](https://user-images.githubusercontent.com/34238240/86396157-082a8080-bcbf-11ea-8891-18b70912db1c.png)

## Commands 
As of now, gitn supports the following commands 
- gitn config - to update configuration parameters
- gitn status - to see which branch user is currently on
- gitn commit - to add a new commit (aka note) to the branch user is currently on
- gitn log - to view all commits (allows for searching using grep) 
- gitn branch - to view/create/delete branches(aka text-files)
- gitn checkout - to switch to a different branch ( use -b flag to create and switch)
- gitn rebase - select specific commits to be deleted from current branch 
- gitn reset - to delete all commits from current branch 
- gitn merge - to merge two branches (and their commits) onto a single branch

## TODOS 
- [X]  git like command line API (version 0.1.0)
- [X]  allow for notes searching using words or RegEx
- [ ]  allow for users to encrypt notes 
- [ ]  add date to each note to allow for date based searching
- [ ]  allow for adding notes to any directory using `git init` and `git add` commands 
- [ ]  and many many more . Make an issue if you think a feature is cool enough to be added to gitn


## Developed and Maintained By 
- Pranav Gupta
- If you like it, consider :star: ing this repo  :smile: 
