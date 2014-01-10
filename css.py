#!/usr/bin/python

import os, sys, glob, argparse, threading, datetime

from scss import Scss
compiler = Scss()

parser = argparse.ArgumentParser(description='Compile all the scss files to css!')
parser.add_argument('-f', '--folder', default='.', help='The source and the destination folder of the scss files')
parser.add_argument('-w', '--watch', action='store_true', help='Watch continously the folder for updates. Blocks the console.')

args = parser.parse_args()

files = dict()

def parseDir():
    folder = args.folder
    for f in os.listdir(folder):
        if os.path.splitext(f)[-1] != '.scss':
           continue

        filepath = folder + '/' + f

        mtime = os.path.getmtime(filepath)

        if files[filepath] == mtime if filepath in files else False:
            continue

        files[filepath] = mtime

        print('[' + datetime.datetime.now().time().strftime('%H:%M:%S') + '] Compiling: ' + filepath)

        with open(filepath, 'r') as content_file:
            css_data = compiler.compile(content_file.read())
            
            with open(folder + '/' + os.path.splitext(f)[0] + '.css', 'w+') as out_file:
                out_file.write(css_data)


def set_interval(func, sec):
    def func_wrapper():
        set_interval(func, sec)
        func()
    t = threading.Timer(sec, func_wrapper)
    t.start()
    return t

if args.watch:
    set_interval(parseDir, 1)

parseDir()

