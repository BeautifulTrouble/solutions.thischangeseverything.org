#!/usr/bin/env perl
# Install requirements with `carton install`
# Run with `carton exec _scripts/create_posts_from_csv.pl _data/modules.csv`

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

use Mojo::Util qw/ trim encode slurp spurt /;
use Mojo::Loader;
use Mojo::Template;
use HTML::Entities;

# Read the output path and filename from STDIN
my $input_file = shift @ARGV;
die 'No input file specified' unless $input_file;

my $filename = $input_file;
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
    my $summary = encode_entities( $row->{'Short Write-Up'} );
    my $dir = $module_type_map{ lc( $module_type ) };
    ( my $output_file = lc( $module_name ) ) =~ s/\W/-/g;
    my $output_path = $dir . '/' . $output_file . '.md';
    my $loader      = Mojo::Loader->new;
    my $template    = $loader->data( __PACKAGE__, 'module' );
    my $mt          = Mojo::Template->new;
    my $output_str  = $mt->render( $template, $summary, $row, \&parse_list, \&parse_learn );
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
        $item = encode_entities( $item );
        $output_str .= "- $item\n";
    }
    return $output_str;
}
sub parse_learn {
    my $str = shift;
    return unless defined $str;
    my @learn_items = split('\n\n', $str );
    my $output_str = '';
    for my $item ( @learn_items ) {
        my ($title, $description, $type, $url ) = split( '\n', $item);
        $title = encode_entities( $title );
        $description = encode_entities( $description );
        $output_str .= "-\n";
        $output_str .= "    title: \"$title\"\n";
        $output_str .= "    description: \"$description\"\n";
        $output_str .= "    type: \"$type\"\n";
        $output_str .= "    url: \"$url\"\n";
    }
    return $output_str;
}

__DATA__
@@ module
% my $summary = shift;
% my $module = shift;
% my $parse_list = shift;
% my $parse_learn = shift;
---
id: <%= $module->{'Beautiful Solutions Entry: ID'} %>
title: <%= $module->{'Beautiful Solutions Entry: beautiful solution name'} %>
short_write_up: "<%= $summary %>"
where: "<%= $module->{'Where?'} %>"
when: "<%= $module->{'When'} %>"
who: "<%= $module->{'Who?'} %>"
scale: "<%= $module->{'Scale'} %>"
values:
<%= $parse_list->( $module->{'Values exemplified'} ) =%>
related_solutions:
<%= $parse_list->( $module->{'Related Solutions'} ) =%>
related_theories:
<%= $parse_list->( $module->{'Related Theories'} ) =%>
related_stories:
<%= $parse_list->( $module->{'Related Stories'} ) =%>
tags:
<%= $parse_list->( $module->{'Tags'} ) =%>
learn_more:
<%= $parse_learn->( $module->{'Learn More'} ) =%>
images:
<% if ( $module->{'image_name'} ) { =%>
-
    url: <%= $module->{'image_name'} %>
    name: <%= $module->{'image_name'} %>
    caption: "<%= $module->{'image_caption'} %>"
    rights: "<%= $module->{'IMAGE RIGHTS'} %>"
<% } else { =%>
-
    url: 'Community-Wealth-Building.jpg'
    name: 'Community-Wealth-Building.jpg' 
    caption: "Grassroots organizers in New York City recently secured $1.2 million in funding from the city council for a key component of community wealth building: the development of worker cooperatives."
    source: "Ecomundo Cleaning Co-operative"
    source_url: "https://www.facebook.com/EcomundoClean/photos/pb.214582215279233.-2207520000.1409980196./642307309173386/?type=3&theater"
    rights: "By permission of Ecomundo Cleaning"
<% } =%>
contributors:
- "<%= $module->{'Primary contributor name'} %>"
---
Full write-up would go here.
