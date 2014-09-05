#!/usr/bin/env perl
# Install requirements with `carton install`
# Run with `carton exec _scripts/create_posts_from_csv.pl modules.csv`

use strict;
use warnings;
use utf8;
use feature 'say';

# Find modules installed w/ Carton
use FindBin;
use lib "$FindBin::Bin/../local/lib/perl5";

# Actual modules the script requires
use Data::Dumper;
use Text::CSV_XS;

use Mojo::Util qw/ encode slurp spurt /;
use Mojo::Loader;
use Mojo::Template;

# Read the output path and filename from STDIN
my $input_file = shift @ARGV;
die 'No input file specified' unless $input_file;

my $filename = "$FindBin::Bin/$input_file";
my @rows;
my $csv
    = Text::CSV_XS->new( { binary => 1, eol => $/, allow_loose_quotes => 1 }
    )    # should set binary attribute.
    or die "Cannot use CSV: " . Text::CSV->error_diag();

open my $fh, "<:encoding(utf8)", $filename or die "$filename: $!";
$csv->column_names( $csv->getline( $fh ) );

while ( my $row = $csv->getline_hr( $fh ) ) {
    push @rows, $row;
}

$csv->eof or $csv->error_diag();
close $fh;

my %module_type_map = (
    story    => '_stories',
    theory   => '_theories',
    value    => '_values',
    solution => '_solutions'
);

for my $row ( @rows ) {
    my $module_name
        = $row->{'Beautiful Solutions Entry: beautiful solution name'};
    my $module_type = $row->{'Type'};
    next unless $module_name && $module_type;
    my $dir = $module_type_map{ lc( $module_type ) };
    ( my $output_file = lc( $module_name ) ) =~ s/\W/-/g;
    my $output_path = $dir . '/' . $output_file . '.md';
    my $loader      = Mojo::Loader->new;
    my $template    = $loader->data( __PACKAGE__, 'module' );
    my $mt          = Mojo::Template->new;
    my $output_str  = $mt->render( $template, $row, \&parse_list );
    $output_str = encode 'UTF-8', $output_str;

    ## Write the template output to a filehandle
    spurt $output_str, $output_path;
    say "Wrote $module_name to $output_path";
}

sub parse_list {
    my $list_str = shift;
    return unless defined $list_str;
    my @list_items = split( '; ', $list_str );
    my $output_str = '';
    for my $item ( @list_items ) {
        $output_str .= "- $item\n";
    }
    return $output_str;
}

__DATA__
@@ module
% my $module = shift;
% my $parse_list = shift;
---
title: <%= $module->{'Beautiful Solutions Entry: beautiful solution name'} %>
short_write_up: "<%= $module->{'Short Write-Up'} %>"
where: <%= $module->{'Where?'} %>
when: <%= $module->{'When? (start)'} %> <%= $module->{'When? (end)'} %>
who: <%= $module->{'Who?'} %>
values:
<%= $parse_list->( $module->{'Values exemplified'} ) =%>
related_solutions:
<%= $parse_list->( $module->{'Related Solutions'} ) =%>
related_theories:
<%= $parse_list->( $module->{'Related Theories'} ) =%>
related_stories:
<%= $parse_list->( $module->{'Related Stories'} ) =%>
scale:
<%= $parse_list->( $module->{'Scale'} ) =%>
tags:
<%= $parse_list->( $module->{'Tags'} ) =%>
learn_more:
- "[Dudley Street Neighborhood Initiative Website](http://www.dsni.org/)"
- "[Peter Medoff & Holly Sklar. Streets of Hope: The Fall and Rise of an Urban Neighborhood. South End Press, 1994.](http://www.southendpress.org/2004/items/StreetsHope)"
images:
-
    url: http://www.dsni.org/sites/default/files/IMG_2135.jpg
    caption:
    source:
contributors:
- <%= $module->{'Primary contributor name'} %>
---
Full write-up would go here in theory.
