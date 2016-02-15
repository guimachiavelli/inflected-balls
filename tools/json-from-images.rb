require 'json'

def main
    entries = Dir.entries('build/imgs').select do |img|
        File.extname(img) == '.jpg'
    end

    entries = entries.map do |img|
        "img/#{img}"
    end

    File.write('build/imgs.json', JSON.generate(entries))
end

main()
